"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findJsonFromOutput = exports.parseArgv = exports.zfill = void 0;
const moment_1 = __importDefault(require("moment"));
function zfill(digits, n) {
    if (n > 7)
        throw Error(`Larger zero fills not supported (n=${n})`);
    return ('000000000000' + digits).slice(-n);
}
exports.zfill = zfill;
function parseArgv(argv, at = 2) {
    let day = moment_1.default.utc().local();
    const dateArg = argv[at];
    if (dateArg) {
        day = dateArg.length > 7 ? (0, moment_1.default)(dateArg, 'YYYY-MM-DD') : (0, moment_1.default)(dateArg, 'YYYY-DD');
    }
    return [day.year(), day.date()];
}
exports.parseArgv = parseArgv;
function findJsonFromOutput(output) {
    let re = new RegExp(/{[\w- \"\':,]+(uzzle)[\w- \"\':,]+}/g);
    let match = re.exec(output);
    return match ? JSON.parse(match[0]) : null;
}
exports.findJsonFromOutput = findJsonFromOutput;
//# sourceMappingURL=format.js.map