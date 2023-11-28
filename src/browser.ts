import Mustache from 'mustache';
import CDP from 'chrome-remote-interface';
import { logger } from './utils/log';
import { writeFile } from './utils/io';
import { zfill } from './utils/format';
import { ProtocolProxyApi } from 'devtools-protocol/types/protocol-proxy-api'
import { PuzzlePart, YearDay } from './types';
import { longPoll } from './long-poll';

type XhrInterceptionArguments = {
    transactionStartedExpression: string;
    responsePayloadExpression: string;
};

export class AdventBrowser {
    client: CDP.Client;
    date: YearDay;
    puzzleFolder: string;
    puzzleFile: string;

    constructor(client: CDP.Client, date: YearDay, puzzleFolder: string, puzzleFile: string) {
        this.client = client;
        this.date = date;
        this.puzzleFolder = puzzleFolder;
        this.puzzleFile = puzzleFile;
    }

    private get runtime(): ProtocolProxyApi.RuntimeApi {
        // @ts-expect-error: can't cast as there some mismatch between the ProxyApi and DefinatelyTyped.
        return this.client.Runtime as ProtocolProxyApi.RuntimeApi;
    }

    private get page() {
        // NOTE: Return type can only be inferred here. ProtocolProxyApi.Page doesn't not implement loadEventFired and
        // explicitly decorating with inherited type fails due to DefinatelyTypes issues.
        return this.client.Page;
    }

    async visitHome() {
        const ready = new Promise(resolve => { this.client.on('ready', resolve) });
        this.page.navigate({ url: `https://adventofcode.com/${this.date.year}` });
        return await ready;
    }

    async longPollDailyUnlock() {
        const anchor = `document.querySelector('a[href="/${this.date.year}/day/${this.date.day}"]');`;
        const asyncFunc = () => this.runtime.evaluate({ expression: anchor });
        const breakPredicate = (anchor: any) => anchor?.result?.className == "HTMLAnchorElement"
        await longPoll({ fn: asyncFunc, breakPredicate, sleep: 750, timeoutSeconds: 60 * 10, log: true });
    }

    private async part2IsSolved() {
        const txtDaySuccess = 'document.querySelector(\'p[class="day-success"]\').textContent';
        const txt = await this.runtime.evaluate({ expression: txtDaySuccess });
        const successMessage = "Both parts of this puzzle are complete";
        return Boolean(txt?.result?.type == "string" && txt?.result?.value.includes(successMessage));
    }

    private async part1IsSolved() {
        const h2Part2 = 'document.querySelector(\'h2[id="part2"]\')';
        const h2 = await this.runtime.evaluate({ expression: h2Part2 });
        return Boolean(h2?.result?.className == "HTMLHeadingElement");
    }

    async IsSolved(partNumber: PuzzlePart) {
        if (partNumber === 1) return await this.part1IsSolved();
        return await this.part2IsSolved();
    }

    visitDay() {
        this.page.navigate({ url: `https://adventofcode.com/${this.date.year}/day/${this.date.day}` });
        return new Promise((resolve) => this.client.Page.loadEventFired(resolve));
    }

    // async returnToDay(date: YearDay): Promise<void> {
    //     const { year, day } = date;
    //     const returnToDay = `document.querySelector('a[href="/${year}/day/${day}]').click();`;
    //     await this.runtime.evaluate({ expression: returnToDay });
    // }

    private async interceptXhr(params: XhrInterceptionArguments) {
        const timestamp = await this.runtime.evaluate({ expression: params.transactionStartedExpression });
        if (timestamp?.result?.value && timestamp?.result?.type == 'string') {
            const { value } = timestamp.result;
            logger.info(`Transaction timestamp for begin of payload interception: ${value}`);
        }
        else return false;

        const xhr = await this.runtime.evaluate({ expression: params.responsePayloadExpression });
        if (xhr && xhr.result && xhr.result.value && xhr.result.type == 'string') {
            const { type, value } = xhr.result;
            const content = value.concat("\n");  // New line is stripped from HTML tag attribute.
            logger.info(`XHR done. Content type: ${type} Content length: ${content.length}`);
            const folder = Mustache.render(this.puzzleFolder, { year: this.date.year, day: zfill(this.date.day, 2) });
            await writeFile(folder, this.puzzleFile, content);
            return true
        }
        else new Error(`Unexpected mutation of XHR response: ${xhr}`);
    }

    async fetchPuzzleInput() {
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
        x.open('GET', "https://adventofcode.com/${this.date.year}/day/${this.date.day}/input");
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

        // Don't await possibly!
        await this.runtime.evaluate({ expression: xhr });
        await longPoll({
            fn: () => this.interceptXhr({
                transactionStartedExpression: timestampExpression,
                responsePayloadExpression: responseTextExpression,
            }),
            breakPredicate: (ok: any) => !!ok,
            sleep: 100,
            timeoutSeconds: 10,
            log: true
        });
    }
}
