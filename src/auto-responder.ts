import moment from 'moment';
import { ProtocolProxyApi } from 'devtools-protocol/types/protocol-proxy-api'
import { logger } from './utils/log';
import { forkChildProcessForSolveEval as forkChildProcessEval } from './utils/io';
import { parseJsonFromStandardOutputOrNull, isNumeric } from './utils/format';
import { PuzzlePart, YearDay } from './types';
import AutoResponderNavigator from './auto-responder-navigator';

export type AutoResponderConstructorArguments = {
    runtime: ProtocolProxyApi.RuntimeApi;
    puzzlePart: PuzzlePart;
    date: YearDay;
    execPath: string;
    module: string;
    seen: number[];
    previousFaultAt: moment.Moment | null;
}

type Explanation = "High" | "Low" | "Unknown";

type SubmissionExplanation = {
    waitSeconds: number;
    explanation: Explanation;
}

enum Numbers {
    One = 1,
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9,
    Ten = 10,
    Eleven = 11,
    Twelwe = 12,
    Thirteen = 13,
    Fourteen = 14,
    Fifteen = 15,
    Sixteen = 16,
    Seventeen = 17,
    Eighteen = 18,
    Nineteen = 19,
    Twenty = 20
}

export class AutoResponder {
    private readonly navigator: AutoResponderNavigator;
    private readonly params: AutoResponderConstructorArguments;
    private readonly seen: Set<string>;
    private max: number
    private min: number;
    private previousFaultAt: moment.Moment;

    constructor(params: AutoResponderConstructorArguments) {
        this.navigator = new AutoResponderNavigator(params.runtime);
        this.params = params;
        this.seen = new Set<string>();
        this.max = params.max ?? Infinity,
        this.min = params.min ?? -Infinity;
        this.previousFaultAt = params.previousFaultAt ?? moment([2010, 1, 1]);
    }

    private skipByTriage(answer: string): boolean {
        if (this.seen.has(answer)) {
            logger.info(`***** Already seen ${answer}. *****`);
            return true;
        }
        if (isNumeric(answer)) {
            const answer_ = Number(answer); 
            if (answer_ <= this.min) {
                logger.info(`***** ${answer} is too low. *****`);
                return true
            }
            if (answer_ >= this.max) {
                logger.info(`***** ${answer} is too high. *****`);
                return true
            }
        }
        return false;
    }

    private pleaseWaitSeconds(paragraph: string, defaultWaitSeconds: number): number {
        const matches = /Please wait (?<amount>\w+) (?<unit>\w+) before trying again/.exec(paragraph);
        const amount = matches?.groups?.amount;
        const unit = matches?.groups?.unit;

        if (unit && amount) {
            let k: number = 60;
            if (/second/.test(unit)) k = 1;
            if (/hour/.test(unit)) k = 60 * 60;

            const amountInvariant: string = amount.slice(0, 1).toUpperCase() + amount.slice(1).toLowerCase();
            const amountNumber: Numbers = Numbers[amountInvariant as keyof typeof Numbers]
            const amountValue: number = amountNumber.valueOf()
            return amountValue * k; 
        }
        logger.error("Unknown unit. Amount: %s, Unit: %s", amount, unit);
        return defaultWaitSeconds;
    }

    // For test
    public explain(paragraph: string, answer: string): SubmissionExplanation {
        const defaultWaitSeconds: number = 120;
        if (paragraph.includes("not the right answer")) {
            this.seen.add(answer);
            this.previousFaultAt = moment.utc();
            const waitSeconds = this.pleaseWaitSeconds(paragraph, defaultWaitSeconds);

            if (isNumeric(answer)) {
                if (paragraph.includes("answer is too high")) {
                    this.max = Math.max(Number(answer), this.max);
                    return { explanation: "High", waitSeconds };
                }
                else if (paragraph.includes("answer is too low")) {
                    this.min = Math.min(Number(answer), this.min);
                    return { explanation: "Low", waitSeconds };
                }
            }
        } 
        return { explanation: "Unknown", waitSeconds: defaultWaitSeconds };
    }

    async start() {
        const ts = moment.utc();
        const pollAnchorTimeoutSeconds = 60 * 60;
        const respondMinimumWait = 31;
        const sleep = 750;
        while (moment.utc().diff(ts, 'seconds', true) < pollAnchorTimeoutSeconds) {
            await new Promise(resolve => setTimeout(resolve, sleep));

            try {
                const output = await forkChildProcessEval(this.params);
                const maybeJson = parseJsonFromStandardOutputOrNull(output);

                if (maybeJson) {
                    const { ok, puzzle } = maybeJson
                    logger.info(`\n${output}`);
                    if (ok == true) {
                        const waitTime = moment.utc().diff(this.previousFaultAt, 'seconds', true);
                        const sleep = Math.max(Math.min(respondMinimumWait - waitTime, respondMinimumWait * 0.1), 0);
                        logger.info(`***** Will commit ${this.params.puzzlePart}: ${puzzle} in ${sleep}s. *****`);
                        await new Promise(resolve => setTimeout(resolve, sleep));

                        if (!this.skipByTriage(puzzle)){
                            await this.navigator.submit(puzzle);
                            const paragraph = await this.navigator.getResponseParagraph();    

                            if (paragraph) {
                                const success = await this.navigator.tryProgressFrom(this.params.puzzlePart, paragraph);
                                if (success) return;
                            }
                        }

                    }
                }
            }
            catch (err: any) {
                logger.error(`Eval error: ${err}`);
            }
        }
    }
}