"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const moment_1 = __importDefault(require("moment"));
const mustache_1 = __importDefault(require("mustache"));
const protocol_1 = require("./utils/protocol");
const log_1 = require("./utils/log");
const io_1 = require("./utils/io");
const format_1 = require("./utils/format");
async function visitHome(client, year) {
    const { Page } = client;
    let ready = new Promise(resolve => {
        client.on('ready', () => resolve(client));
    });
    Page.navigate({ url: `https://adventofcode.com/${year}` });
    return await ready;
}
async function loop(asyncFunc, breakPredicate, sleep, timeoutSeconds, log = false) {
    const ts = moment_1.default.utc();
    while (moment_1.default.utc().diff(ts, 'seconds', true) < timeoutSeconds) {
        if (log)
            log_1.logger.info(`Polling wait ${sleep}ms`);
        await new Promise(resolve => setTimeout(resolve, sleep));
        let result = await asyncFunc();
        if (breakPredicate(result))
            break;
    }
}
async function selectAnchor(context, year, day) {
    const { Runtime } = context;
    const anchor = `document.querySelector('a[href="/${year}/day/${day}"]');`;
    const asyncFunc = () => Runtime.evaluate({ expression: anchor });
    const breakAt = (a) => a?.result?.className == "HTMLAnchorElement";
    await loop(asyncFunc, breakAt, 750, 60 * 10, true);
}
async function part2Complete(context) {
    const { Runtime } = context;
    const txtDaySuccess = 'document.querySelector(\'p[class="day-success"]\').textContent';
    const txt = await Runtime.evaluate({ expression: txtDaySuccess });
    const successMessage = "Both parts of this puzzle are complete";
    return Boolean(txt?.result?.type == "string" && txt?.result?.value.includes(successMessage));
}
async function part1Complete(context) {
    const { Runtime } = context;
    const h2Part2 = 'document.querySelector(\'h2[id="part2"]\')';
    const h2 = await Runtime.evaluate({ expression: h2Part2 });
    return Boolean(h2?.result?.className == "HTMLHeadingElement");
}
function visitDay(context, year, day) {
    const { Page } = context;
    Page.navigate({ url: `https://adventofcode.com/${year}/day/${day}` });
    return new Promise((resolve) => Page.loadEventFired(() => { resolve(context); }));
}
async function fetchPuzzleInput(context, year, day, puzzleFile, puzzleFolder) {
    const { Runtime } = context;
    const responseTextExpression = `(function () {
        var el = document.getElementById("ab0ed957-70d7-4ea4-8dcb-5488ea950d1f");
        if (el) return el.payload;
        return null;
      }());`;
    const timestampExpression = `(function () {
        var el = document.getElementById("221b8067-266f-4cce-a0dd-5b7008ff8660");
        if (el) return el.textContent;
        return null;
        }());`;
    const xhr = `(function () {
        document.puzzleInput = null;
        var x = new XMLHttpRequest();
        x.open('GET', "https://adventofcode.com/${year}/day/${day}/input");
        x.withCredentials = true;
        x.onload = (e) => {
          if (x.readyState === 4) {
            var message = x.responseText.toString();
            var tag = document.createElement("p");
            tag.id = "ab0ed957-70d7-4ea4-8dcb-5488ea950d1f"
            tag.payload = message;
            var text = document.createTextNode("payload");
            tag.appendChild(text);
            var htmldoc = document.querySelector('html');
            htmldoc.appendChild(tag);
            
            var tag2 = document.createElement("p");
            tag2.id = "221b8067-266f-4cce-a0dd-5b7008ff8660"
            var text2 = document.createTextNode(new Date().toISOString());
            tag2.appendChild(text2);
            htmldoc.appendChild(tag2);
          }
        };
        x.send();
      }());`;
    async function interceptXHR(runtime) {
        let timestamp = await runtime.evaluate({ expression: timestampExpression });
        if (timestamp?.result?.value && timestamp?.result?.type == 'string') {
            const { value } = timestamp.result;
            log_1.logger.info(`Timestamp of interception: ${value}`);
        }
        else
            return false;
        let xhr = await runtime.evaluate({ expression: responseTextExpression });
        if (xhr && xhr.result && xhr.result.value && xhr.result.type == 'string') {
            const { type, value } = xhr.result;
            const content = value.concat("\n");
            log_1.logger.info(`XHR done. Content type: ${type} Content length: ${content.length}`);
            const folder = mustache_1.default.render(puzzleFolder, { year: year, day: (0, format_1.zfill)(day, 2) });
            await (0, io_1.writeFilePromise)(folder, puzzleFile, content);
            return true;
        }
        else
            new Error(`Unexpected mutation of XHR response: ${xhr}`);
    }
    Runtime.evaluate({ expression: xhr });
    const rt = Runtime;
    await loop(() => interceptXHR(rt), (ok) => ok, 100, 10, true);
}
class Responder {
    runtime;
    interoperationOption;
    seen;
    max;
    min;
    faultAt;
    year;
    day;
    execPath;
    module;
    constructor(context, interoperationOption, year, day, execPath, module) {
        this.runtime = context.Runtime;
        this.interoperationOption = interoperationOption;
        this.seen = new Set();
        this.max = Infinity,
            this.min = -Infinity;
        this.faultAt = (0, moment_1.default)([2010, 1, 1]);
        this.year = year;
        this.day = day;
        this.execPath = execPath;
        this.module = module;
    }
    async evalHtml(answer) {
        const Runtime = this.runtime;
        const puzzleResponse = 'document.querySelector("p").textContent;';
        const returnToDay = `document.querySelector('a[href="/${this.year}/day/${this.day}]').click();`;
        const typeInput = `document.querySelector('input[name="answer"]').value = ${Number(answer)};`;
        const submit = `document.querySelector('input[type="submit"]').click();`;
        const hasNext = `document.querySelector("a[href*='part2']");`;
        const next = `document.querySelector("a[href*='part2']").click();`;
        const p = await Runtime.evaluate({ expression: puzzleResponse });
        const { type, value } = p.result;
        let correct = true;
        if (type == 'string') {
            if (value.includes("not the right answer")) {
                correct = false;
                this.seen.add(answer);
                this.faultAt = moment_1.default.utc();
                if (value.includes("answer is too high")) {
                    this.max = Math.max(answer, this.max);
                    log_1.logger.info(`***** Answer was too high *****`);
                }
                else if (value.includes("answer is too low")) {
                    this.min = Math.min(answer, this.min);
                    log_1.logger.info(`***** Answer was too low *****`);
                }
                else {
                    log_1.logger.info(`***** Answer was wrong *****`);
                }
                await Runtime.evaluate({ expression: returnToDay });
                return false;
            }
            else {
                await Runtime.evaluate({ expression: typeInput });
                await Runtime.evaluate({ expression: submit });
                if (await Runtime.evaluate({ expression: hasNext }))
                    await Runtime.evaluate({ expression: next });
            }
        }
        return true;
    }
    async start() {
        const ts = moment_1.default.utc();
        const pollAnchorTimeoutSeconds = 60 * 60;
        const respondMinimumWait = 31;
        const sleep = 750;
        while (moment_1.default.utc().diff(ts, 'seconds', true) < pollAnchorTimeoutSeconds) {
            await new Promise(resolve => setTimeout(resolve, sleep));
            try {
                let output = await (0, io_1.fork_solve)(this.year, this.day, this.interoperationOption, this.execPath, this.module);
                const jsonOption = (0, format_1.findJsonFromOutput)(output);
                if (jsonOption) {
                    let { ok, puzzle, test } = jsonOption;
                    log_1.logger.info(`ok: ${ok} --- test: ${test} --- puzzle: ${puzzle}\n${output}`);
                    if (ok == true) {
                        if (this.seen.has(puzzle)) {
                            log_1.logger.info(`***** Already seen ${puzzle}. No commit! *****`);
                            continue;
                        }
                        if (puzzle <= this.min) {
                            log_1.logger.info(`***** ${puzzle} is too low. No commit! *****`);
                            continue;
                        }
                        if (puzzle >= this.max) {
                            log_1.logger.info(`***** ${puzzle} is too high. No commit! *****`);
                            continue;
                        }
                        const waitTime = moment_1.default.utc().diff(this.faultAt, 'seconds', true);
                        const sleep = Math.max(Math.min(respondMinimumWait - waitTime, respondMinimumWait * 0.1), 0);
                        log_1.logger.info(`***** Will commit ${this.interoperationOption}: ${puzzle} after ${sleep}s *****`);
                        await new Promise(resolve => setTimeout(resolve, sleep));
                        const success = await this.evalHtml(puzzle);
                        if (success)
                            return puzzle;
                    }
                }
            }
            catch (err) {
                log_1.logger.error(`Eval error: ${err}`);
            }
        }
    }
}
async function start(argv) {
    dotenv_1.default.config();
    const [year, day] = (0, format_1.parseArgv)(argv);
    const envVars = [
        process.env.AOCW_EXEC, process.env.AOCW_MODULE, process.env.AOCW_PUZZLE_FILE, process.env.AOCW_PUZZLE_FOLDER
    ];
    if (!envVars.every(v => v)) {
        throw new Error("Environment variables not set " + envVars);
    }
    const [execPath, module, puzzleFile, puzzleFolder] = envVars;
    const client = await (0, protocol_1.attachChromeDevToolsProtocol)();
    log_1.logger.info("Browser online");
    await visitHome(client, year);
    await selectAnchor(client, year, day);
    await visitDay(client, year, day);
    await fetchPuzzleInput(client, year, day, puzzleFile, puzzleFolder);
    let part2Done = await part2Complete(client);
    if (part2Done) {
        log_1.logger.info("Part 2 already completed.");
        process.exit();
    }
    let part1Done = await part1Complete(client);
    if (part1Done) {
        log_1.logger.info("Part 1 already completed. Skipping part 1.");
    }
    else {
        const responder1 = new Responder(client, "-json1", year, day, execPath, module);
        await responder1.start();
    }
    const responder2 = new Responder(client, "-json2", year, day, execPath, module);
    await responder2.start();
    log_1.logger.info(`Done! Good job dudes and dudettes!`);
    process.exit();
}
start(process.argv);
//# sourceMappingURL=main.js.map