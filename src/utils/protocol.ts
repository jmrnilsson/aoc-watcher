import CDP from 'chrome-remote-interface';
import { logger } from './log';

export async function attachChromeDevToolsProtocol(): Promise<CDP.Client> {
    const cdp = await CDP();
    cdp.Network.requestWillBeSent((params) => {
        logger.info(params.request.url);
    });
    await cdp.Network.enable();
    await cdp.Page.enable();
    await cdp.Runtime.enable();
    return cdp;
}
