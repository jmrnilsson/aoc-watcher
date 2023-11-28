import { ProtocolProxyApi } from 'devtools-protocol/types/protocol-proxy-api';
// import { PuzzlePart, YearDay } from './types';


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

    // private async tryProgressFromPart1(): Promise<boolean> {
    //     const hasNext = `document.querySelector("a[href*='part2']");`;
    //     const next = `document.querySelector("a[href*='part2']").click();`;
    //     if (await this.runtime.evaluate({ expression: hasNext })) {
    //         await this.runtime.evaluate({ expression: next });
    //         return true;
    //     }
    //     return false;
    // }

    // async tryProgressFrom(puzzlePart: PuzzlePart, paragraph: string): Promise<boolean> {
    //     if (puzzlePart === 1) return this.tryProgressFromPart1();
    //     return this.tryProgressFromPart2(paragraph);
    // }

    async getResponseParagraph(): Promise<string | null> {
        const puzzleResponse = 'document.querySelector("p").textContent;';
        const p = await this.runtime.evaluate({ expression: puzzleResponse });
        const { type, value } = p.result;
        return type == 'string' ? value : null;
    }
}
