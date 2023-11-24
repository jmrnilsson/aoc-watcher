import CDP from 'chrome-remote-interface';
import { logger } from './log';
import { AdventError } from '../types';


const errorMessage = "ECONNREFUSED while connecting to browser. Make sure to have a remote debugger session with: "
  + "--remote-debugging-port=9222 for brave, firefox or chrome.";

export async function attachChromeDevToolsProtocol(): Promise<CDP.Client> {
  try {
    const cdp = await CDP();
    cdp.Network.requestWillBeSent((params) => {
      logger.info(params.request.url);
    });
    await cdp.Network.enable();
    await cdp.Page.enable();
    await cdp.Runtime.enable();
    return cdp;
  }
  catch (error: any) {
    if (/ECONNREFUSED/.test(error.message)) {
      throw new AdventError(errorMessage)
    }
    throw error;
  }
}
