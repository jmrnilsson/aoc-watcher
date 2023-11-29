import { ProtocolProxyApi } from 'devtools-protocol/types/protocol-proxy-api';
import { YearDay } from './types';
// import { PuzzlePart, YearDay } from './types';


export default class AutoResponderNavigator {
    private readonly runtime: ProtocolProxyApi.RuntimeApi;
    private readonly date: YearDay;

    constructor(runtime: ProtocolProxyApi.RuntimeApi, date: YearDay) {
        this.runtime = runtime;
        this.date = date;
    }

    async submit(answer: string): Promise<void> {
        const typeInput = `document.querySelector('input[name="answer"]').value = "${answer}";`;
        const submit = `document.querySelector('input[type="submit"]').click();`;
        await this.runtime.evaluate({ expression: typeInput });
        await this.runtime.evaluate({ expression: submit });
    }

    // <a href="/2016/day/2">[Return to Day 2]</a>
    // <a href="/2016/day/2">[Return to Day 2]</a>
    async returnToDay(): Promise<void> {
        // Skip this part to avoid spamming
        // await new Promise(resolve => setImmediate(resolve));
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        const { year, day } = this.date;
        const returnToDay = `document.querySelector('a[href="/${year}/day/${day}"]').click();`;
        await this.runtime.evaluate({ expression: returnToDay });
    }

    async getResponseParagraph(): Promise<string | null> {
        const puzzleResponse = 'document.querySelector("p").textContent;';
        const p = await this.runtime.evaluate({ expression: puzzleResponse });
        const { type, value } = p.result;
        return type == 'string' ? value : null;
    }
}
