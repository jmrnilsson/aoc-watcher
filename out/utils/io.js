"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fork_solve = exports.writeFilePromise = void 0;
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const node_path_1 = __importDefault(require("node:path"));
const child_process_1 = require("child_process");
const mustache_1 = __importDefault(require("mustache"));
const format_1 = require("./format");
const log_1 = require("./log");
async function writeFilePromise(folder, fileName, content) {
    if (!fs.existsSync(folder)) {
        log_1.logger.info(`Creating dir: ${folder}`);
        fs.mkdirSync(folder, { recursive: true });
    }
    const fullName = node_path_1.default.join(folder, fileName);
    if (fs.existsSync(fullName)) {
        log_1.logger.info(`Truncate file: ${fullName}`);
        await fs_1.promises.truncate(fullName, 0);
    }
    await fs_1.promises.writeFile(fullName, content);
}
exports.writeFilePromise = writeFilePromise;
function fork_solve(year, day, flag, execPath, module) {
    const flag_ = flag || '-json1';
    let args = [mustache_1.default.render(module, { year: year, day: (0, format_1.zfill)(day, 2) }), flag_];
    return new Promise((resolve, reject) => {
        const cp = (0, child_process_1.spawn)(execPath, args);
        let content = '';
        let error = '';
        cp.stdout.setEncoding('utf8');
        cp.stdout.on('data', (chunk) => { content += chunk; });
        cp.stderr.setEncoding('utf8');
        cp.stderr.on('data', (err) => { error += err; });
        cp.on('exit', () => { error ? reject(error) : resolve(content); });
    });
}
exports.fork_solve = fork_solve;
//# sourceMappingURL=io.js.map