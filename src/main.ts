import dotenv from 'dotenv';
import CDP from 'chrome-remote-interface';
import { attachChromeDevToolsProtocol } from './utils/protocol';
import { logger } from './utils/log';
import { parseArgvToDate } from './utils/format';
import { AdventBrowser } from './browser';
import { AutoResponder } from './responder';
import ProtocolProxyApi from 'devtools-protocol/types/protocol-proxy-api';

async function start(argv: string[]) {
    dotenv.config();
    const date = parseArgvToDate(argv);
    const envVars = [
        process.env.AOCW_EXEC!,
        process.env.AOCW_MODULE!,
        process.env.AOCW_PUZZLE_FILE!,
        process.env.AOCW_PUZZLE_FOLDER!
    ];
    if (!envVars.every(v => !!v)) {
        throw new Error("Environment variables not set " + envVars)
    }
    const [execPath, module, puzzleFile, puzzleFolder] = envVars;
    const client: CDP.Client = await attachChromeDevToolsProtocol();
    // @ts-expect-error: can't cast as there some mismatch between the ProxyApi and DefinatelyTyped.
    const runtime = client.Runtime as ProtocolProxyApi.RuntimeApi;
    const autoResponderCtorArguments = {date, execPath, module, runtime };

    const browser = new AdventBrowser(client, date, puzzleFolder, puzzleFile);
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
        const part1Responder = new AutoResponder({...autoResponderCtorArguments, puzzlePart: 1});
        await part1Responder.start();
    }
    const part2Responder = new AutoResponder({...autoResponderCtorArguments, puzzlePart: 2});
    await part2Responder.start();

    logger.info(`Done! Good job dudes and dudettes!`);
    process.exit();
}

start(process.argv);