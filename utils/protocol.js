const CDP = require('chrome-remote-interface');
const { logger } = require('./log');


async function attachChromeDevToolsProtocol() {
    const cdp = await CDP();
    cdp.Network.requestWillBeSent((params) => {
        logger.info(params.request.url);
    });
    await cdp.Network.enable();
    await cdp.Page.enable();
    await cdp.Runtime.enable();
    return cdp;
}

exports.attachChromeDevToolsProtocol = attachChromeDevToolsProtocol;