import dotenv from 'dotenv';
import moment from 'moment';
import Mustache from 'mustache';
import CDP from 'chrome-remote-interface';
import { attachChromeDevToolsProtocol } from './utils/protocol';
import { logger } from './utils/log';
import { writeFilePromise, fork_solve } from './utils/io';
import { zfill, parseArgv, findJsonFromOutput } from './utils/format';
import {ProtocolProxyApi} from 'devtools-protocol/types/protocol-proxy-api'

async function visitHome(client: CDP.Client, year: number) {
    const {Page} = client;
    let ready = new Promise(resolve => {
        client.on('ready', () => resolve(client));
    });
    Page.navigate({ url: `https://adventofcode.com/${year}` });
    return await ready;
}

async function loop(asyncFunc: Function, breakPredicate: Function, sleep: number, timeoutSeconds: number, log: boolean = false){
    const ts = moment.utc();
    while (moment.utc().diff(ts, 'seconds', true) < timeoutSeconds){
        if (log) logger.info(`Polling wait ${sleep}ms`);
        await new Promise(resolve => setTimeout(resolve, sleep));
        let result = await asyncFunc()
        if (breakPredicate(result)) break;
    }
}

async function selectAnchor(context: CDP.Client, year: number, day: number) {
    const {Runtime} = context;
    const anchor = `document.querySelector('a[href="/${year}/day/${day}"]');`;
    const asyncFunc = () => Runtime.evaluate({ expression: anchor });
    const breakAt = (a: any) => a?.result?.className == "HTMLAnchorElement"
    await loop(asyncFunc, breakAt, 750, 60 * 10, true);
}


async function part2Complete(context: CDP.Client) {
    const {Runtime} = context;
    const txtDaySuccess = 'document.querySelector(\'p[class="day-success"]\').textContent';
    const txt =  await Runtime.evaluate({ expression: txtDaySuccess });
    const successMessage = "Both parts of this puzzle are complete";
    return Boolean(txt?.result?.type == "string" && txt?.result?.value.includes(successMessage));
}

async function part1Complete(context: CDP.Client) {
    const {Runtime} = context;
    const h2Part2 = 'document.querySelector(\'h2[id="part2"]\')';
    const h2 = await Runtime.evaluate({ expression: h2Part2 });
    return Boolean(h2?.result?.className == "HTMLHeadingElement");
}

function visitDay(context: CDP.Client, year: number, day: number) {
    const {Page} = context;
    Page.navigate({ url: `https://adventofcode.com/${year}/day/${day}` });
    return new Promise((resolve) => Page.loadEventFired(() => { resolve(context); }));
}

async function fetchPuzzleInput(context: CDP.Client, year: number, day: number, puzzleFile: string, puzzleFolder: string) {
    const {Runtime} = context;
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

    async function interceptXHR(runtime: ProtocolProxyApi.RuntimeApi){
        let timestamp = await runtime.evaluate({ expression: timestampExpression });
        if (timestamp?.result?.value && timestamp?.result?.type == 'string') {
            const {value} = timestamp.result;
            logger.info(`Timestamp of interception: ${value}`);
        }
        else return false;

        let xhr = await runtime.evaluate({ expression: responseTextExpression });
        if (xhr && xhr.result && xhr.result.value && xhr.result.type == 'string'){
            const {type, value} = xhr.result;
            const content = value.concat("\n");  // New line is stripped from HTML tag attribute.
            logger.info(`XHR done. Content type: ${type} Content length: ${content.length}`);
            const folder = Mustache.render(puzzleFolder, {year: year, day: zfill(day, 2)});
            await writeFilePromise(folder, puzzleFile, content);
            return true
        }
        else new Error(`Unexpected mutation of XHR response: ${xhr}`);
    }
    
    Runtime.evaluate({ expression: xhr });
    // @ts-ignore
    const rt = Runtime as ProtocolProxyApi.RuntimeApi;
    await loop(() => interceptXHR(rt), (ok: any) => ok, 100, 10, true);
}


class Responder {
    runtime: ProtocolProxyApi.RuntimeApi;
    interoperationOption: InteropPart;
    seen: Set<number>;
    max: number
    min: number;
    faultAt: moment.Moment;
    year: number;
    day: number;
    execPath: string;
    module: string;

    constructor(context: CDP.Client, interoperationOption: InteropPart, year: number, day: number, execPath: string, module: string) {
        // @ts-ignore
        this.runtime = context.Runtime;
        this.interoperationOption = interoperationOption;
        this.seen = new Set<number>();
        this.max = Infinity,
        this.min = -Infinity;
        this.faultAt = moment([2010, 1, 1]);
        this.year = year;
        this.day = day;
        this.execPath = execPath;
        this.module = module;
    }

    async evalHtml(answer: number) {
        const Runtime = this.runtime;
        const puzzleResponse = 'document.querySelector("p").textContent;';
        const returnToDay = `document.querySelector('a[href="/${this.year}/day/${this.day}]').click();`;
        const typeInput = `document.querySelector('input[name="answer"]').value = ${Number(answer)};`;
        const submit = `document.querySelector('input[type="submit"]').click();` 
        const hasNext = `document.querySelector("a[href*='part2']");`
        const next = `document.querySelector("a[href*='part2']").click();`
        const p = await Runtime.evaluate({ expression: puzzleResponse });
        const {type, value} = p.result;
        let correct = true;
        if (type == 'string'){
    
            if (value.includes("not the right answer")){
                correct = false;
                this.seen.add(answer);
                this.faultAt = moment.utc();
                if (value.includes("answer is too high")){
                    this.max = Math.max(answer, this.max);
                    logger.info(`***** Answer was too high *****`);
                }
                else if (value.includes("answer is too low")){
                    this.min = Math.min(answer, this.min);
                    logger.info(`***** Answer was too low *****`);
                }
                else {
                    logger.info(`***** Answer was wrong *****`);
                }
                await Runtime.evaluate({ expression: returnToDay });
                return false;
            }
            else{          
                await Runtime.evaluate({ expression: typeInput });
                await Runtime.evaluate({ expression: submit });
                if (await Runtime.evaluate({ expression: hasNext })) await Runtime.evaluate({ expression: next });
            }
        }
        return true;
    }

    async start(){
        const ts = moment.utc();
        const pollAnchorTimeoutSeconds = 60 * 60;
        const respondMinimumWait = 31;
        const sleep = 750;
        while (moment.utc().diff(ts, 'seconds', true) < pollAnchorTimeoutSeconds){
            await new Promise(resolve => setTimeout(resolve, sleep));
    
            try {
                let output = await fork_solve(this.year, this.day, this.interoperationOption, this.execPath, this.module);
                const jsonOption = findJsonFromOutput(output);
                
                if (jsonOption){
                    let {ok, puzzle, test} = jsonOption
                    logger.info(`ok: ${ok} --- test: ${test} --- puzzle: ${puzzle}\n${output}`);
                    if (ok == true){
                        if (this.seen.has(puzzle)){
                            logger.info(`***** Already seen ${puzzle}. No commit! *****`);
                            continue;
                        }
                        if (puzzle <= this.min){
                            logger.info(`***** ${puzzle} is too low. No commit! *****`);
                            continue;
                        }
                        if (puzzle >= this.max){
                            logger.info(`***** ${puzzle} is too high. No commit! *****`);
                            continue;
                        }
                        const waitTime = moment.utc().diff(this.faultAt, 'seconds', true);
                        const sleep = Math.max(Math.min(respondMinimumWait - waitTime, respondMinimumWait * 0.1), 0);
                        logger.info(`***** Will commit ${this.interoperationOption}: ${puzzle} after ${sleep}s *****`);
                        await new Promise(resolve => setTimeout(resolve, sleep));
                        const success = await this.evalHtml(puzzle);
                        if (success) return puzzle;
                    }
                }
            }
            catch(err){
                logger.error(`Eval error: ${err}`);
            }
        }   
    }
}

async function start(argv: string[]) {
    dotenv.config();
    const [year, day] = parseArgv(argv);
    const envVars = [
        process.env.AOCW_EXEC!, process.env.AOCW_MODULE!, process.env.AOCW_PUZZLE_FILE!, process.env.AOCW_PUZZLE_FOLDER!
    ];
    if (!envVars.every(v => v)) {
        throw new Error("Environment variables not set " + envVars)
    }
    const [execPath, module, puzzleFile, puzzleFolder] = envVars;
    const client: CDP.Client = await attachChromeDevToolsProtocol();
    
    logger.info("Browser online");

    await visitHome(client, year);
    await selectAnchor(client, year, day);
    await visitDay(client, year, day);
    await fetchPuzzleInput(client, year, day, puzzleFile, puzzleFolder);
    
    let part2Done = await part2Complete(client);
    if (part2Done) {
        logger.info("Part 2 already completed.");
        process.exit();
    }
    let part1Done = await part1Complete(client);
    if (part1Done) {
        logger.info("Part 1 already completed. Skipping part 1.");
    }
    else {
        const responder1 = new Responder(client, "-json1", year, day, execPath, module);
        await responder1.start();
    }
    const responder2 = new Responder(client, "-json2", year, day, execPath, module);
    await responder2.start();

    logger.info(`Done! Good job dudes and dudettes!`);
    process.exit();
}

start(process.argv);