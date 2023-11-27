import dotenv from 'dotenv';
import CDP from 'chrome-remote-interface';
import { attachChromeDevToolsProtocol } from './utils/protocol';
import { logger } from './utils/log';
import { getEnvs, parseArgvToDate } from './utils/format';
import { AdventBrowser } from './browser';
import { AutoResponder } from './auto-responder';
import ProtocolProxyApi from 'devtools-protocol/types/protocol-proxy-api';
import { readHistory } from './utils/io';

async function start(argv: string[]) {
    dotenv.config();
    const date = parseArgvToDate(argv);
    const client: CDP.Client = await attachChromeDevToolsProtocol();
    // @ts-expect-error: can't cast as there some mismatch between the ProxyApi and DefinatelyTyped.
    const runtime = client.Runtime as ProtocolProxyApi.RuntimeApi;
    const vars = getEnvs();
    const history = await readHistory();
    const { seen, previousFaultAt } = history[`${date.year}-${date.day}`];
    const autoResponderCtorArguments = {
        date,
        execPath: vars.execPath,
        module: vars.module,
        runtime,
        seen,
        previousFaultAt
    };

    const browser = new AdventBrowser(client, date, vars.puzzleFolder, vars.puzzleFile);
    logger.info("Browser online");

    await browser.visitHome();
    await browser.longPollDailyUnlock();
    await browser.visitDay();
    await browser.fetchPuzzleInput();

    if (await browser.IsSolved(2)) {
        logger.info("Part 2 already completed.");
        process.exit();
    }
    if (await browser.IsSolved(1)) {
        logger.info("Part 1 already completed. Skipping part 1.");
    }
    else {
        const part1Responder = new AutoResponder({ ...autoResponderCtorArguments, puzzlePart: 1 });
        await part1Responder.start();
    }
    const part2Responder = new AutoResponder({ ...autoResponderCtorArguments, puzzlePart: 2 });
    await part2Responder.start();

    logger.info(`Done! Good job dudes and dudettes! You made Santa proud today!`);
    process.exit();
}

start(process.argv);