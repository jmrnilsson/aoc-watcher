import dotenv from 'dotenv';
import CDP from 'chrome-remote-interface';
import { attachChromeDevToolsProtocol } from './utils/protocol';
import { logger } from './utils/log';
import { getEnvs, parseArgvToDate } from './utils/format';
import { AdventBrowser } from './browser';
import { AutoResponder } from './auto-responder';
import ProtocolProxyApi from 'devtools-protocol/types/protocol-proxy-api';
import AdventHistoryFile from './utils/advent-history-file';
import { Puzzle } from './puzzle';


export async function start(argv: string[]) {
    dotenv.config();
    const date = parseArgvToDate(argv);
    const client: CDP.Client = await attachChromeDevToolsProtocol();
    // @ts-expect-error: can't cast as there some mismatch between the ProxyApi and DefinatelyTyped.
    const runtime = client.Runtime as ProtocolProxyApi.RuntimeApi;
    const vars = getEnvs();
    const fileAccess = new AdventHistoryFile();
    await fileAccess.initialize();
    await fileAccess.save(null);
    const autoResponderCtorArguments = { date, execPath: vars.execPath, module: vars.module, runtime, fileAccess };

    const browser = new AdventBrowser(client, date, vars.puzzleFolder, vars.puzzleFile);
    logger.info("Browser online.");

    await browser.visitHome();
    await browser.longPollDailyUnlock();
    await browser.visitDay();
    await browser.fetchPuzzleInput();

    if (await browser.IsSolved(Puzzle.part2())) {
        logger.info("Part 2 already completed.");
        process.exit();
    }
    if (await browser.IsSolved(Puzzle.part1())) {
        logger.info("Part 1 already completed. Skipping part 1.");
    }
    else {
        const part1Responder = new AutoResponder({ ...autoResponderCtorArguments, puzzle: Puzzle.part1() });
        await part1Responder.start();
        await browser.visitDay();
    }
    const part2Responder = new AutoResponder({ ...autoResponderCtorArguments, puzzle: Puzzle.part2() });
    await part2Responder.start();

    logger.info(`Done! Good job dudes and dudettes! You made Santa proud today!`);
    process.exit();
}