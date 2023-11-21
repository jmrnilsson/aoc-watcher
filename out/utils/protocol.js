"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachChromeDevToolsProtocol = void 0;
const chrome_remote_interface_1 = __importDefault(require("chrome-remote-interface"));
const log_1 = require("./log");
async function attachChromeDevToolsProtocol() {
    const cdp = await (0, chrome_remote_interface_1.default)();
    cdp.Network.requestWillBeSent((params) => {
        log_1.logger.info(params.request.url);
    });
    await cdp.Network.enable();
    await cdp.Page.enable();
    await cdp.Runtime.enable();
    return cdp;
}
exports.attachChromeDevToolsProtocol = attachChromeDevToolsProtocol;
//# sourceMappingURL=protocol.js.map