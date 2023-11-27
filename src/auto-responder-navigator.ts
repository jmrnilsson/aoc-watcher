import { ProtocolProxyApi } from 'devtools-protocol/types/protocol-proxy-api';
import { PuzzlePart, YearDay } from './types';


export default class AutoResponderNavigator {
    private readonly runtime: ProtocolProxyApi.RuntimeApi;

    constructor(runtime: ProtocolProxyApi.RuntimeApi) {
        this.runtime = runtime;
    }

    async submit(answer: string): Promise<void> {
        const typeInput = `document.querySelector('input[name="answer"]').value = "${answer}";`;
        const submit = `document.querySelector('input[type="submit"]').click();`;
        await this.runtime.evaluate({ expression: typeInput });
        await this.runtime.evaluate({ expression: submit });
    }

    private async tryProgressFromPart1(): Promise<boolean> {
        const hasNext = `document.querySelector("a[href*='part2']");`;
        const next = `document.querySelector("a[href*='part2']").click();`;
        if (await this.runtime.evaluate({ expression: hasNext })) {
            await this.runtime.evaluate({ expression: next });
            return true;
        }
        return false;
    }

    private async tryProgressFromPart2(paragraph: string): Promise<boolean> {
        if (/(That's the right answer|You've finished every puzzle)/i.test(paragraph)) return true;
        return false;
    }

    async tryProgressFrom(puzzlePart: PuzzlePart, paragraph: string): Promise<boolean> {
        if (puzzlePart === 1) return this.tryProgressFromPart1();
        return this.tryProgressFromPart2(paragraph);
    }

    async getResponseParagraph(): Promise<string | null> {
        const puzzleResponse = 'document.querySelector("p").textContent;';
        const p = await this.runtime.evaluate({ expression: puzzleResponse });
        const { type, value } = p.result;
        return type == 'string' ? value : null;
    }

    async returnToDay(date: YearDay): Promise<void> {
        const { year, day } = date;
        const returnToDay = `document.querySelector('a[href="/${year}/day/${day}]').click();`;
        await this.runtime.evaluate({ expression: returnToDay });
    }
}
