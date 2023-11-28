import moment, { Moment } from 'moment';
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

type Explanation = "High" | "Low" | "Unknown" | "Success";

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
    private waitSeconds: number = 0;
    // private complete: boolean = false;

    constructor(params: AutoResponderConstructorArguments) {
        this.navigator = new AutoResponderNavigator(params.runtime);
        this.params = params;
        this.seen = new Set<string>();
        this.max = Math.max(...params.seen, Infinity);
        this.min = Math.min(...params.seen, -Infinity);
        this.previousFaultAt = params.previousFaultAt ?? moment().utc().add(-1, 'hours');
    }

    private skipByTriage(answer: string): boolean {
        if (this.seen.has(answer)) {
            logger.info(`***** Triage: Already seen ${answer}! *****`);
            return true;
        }
        if (isNumeric(answer)) {
            const answer_ = Number(answer);
            if (answer_ <= this.min) {
                logger.info(`***** Triage: ${answer} is too low! *****`);
                return true
            }
            if (answer_ >= this.max) {
                logger.info(`***** Triage: ${answer} is too high! *****`);
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

    // Public for unit testing purposes.
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
        } else if (/(That's the right answer|You've finished every puzzle)/i.test(paragraph)) {
            return { explanation: "Success", waitSeconds: 0 };
        }
        return { explanation: "Unknown", waitSeconds: defaultWaitSeconds };
    }

    private async trySubmit(maybeJson: any, output: string): Promise<boolean> {
        const minSecondsToWait = 31;
        const { ok, puzzle } = maybeJson;
        logger.info(`\n${output}`);
        if (ok !== true) return false;

        const minUntil: Moment = this.previousFaultAt.add(minSecondsToWait, 'seconds');
        const until: Moment = this.previousFaultAt.add(this.waitSeconds, 'seconds');
        // const minWait = moment.utc().diff(_minWait, 'seconds', true);
        // const toWait = moment.utc().diff(_toWait, 'seconds', true);
        if (this.skipByTriage(puzzle)) return false;

        const minWaitMilliseconds: number = minUntil.diff(moment.utc());
        const waitMilliseconds: number =  until.diff(moment.utc());
        if (waitMilliseconds > 0 || minWaitMilliseconds > 0) {
            const waitSeconds = Math.max(waitMilliseconds, minWaitMilliseconds) / 1000;
            logger.info(`***** Will commit ${this.params.puzzlePart}: ${puzzle} in ${waitSeconds}s. *****`);
            return false;
        }

        await this.navigator.submit(puzzle);
        const paragraph = await this.navigator.getResponseParagraph();
        if (!paragraph) return false;
        const { waitSeconds, explanation } = this.explain(paragraph, puzzle);
        this.waitSeconds = waitSeconds;
        if (explanation === "Success") {
            logger.info(`***** Success with part ${this.params.puzzlePart} *****`);
            // this.complete = true;
            return true;

// '                if (this.params.puzzlePart === 1) {
//                     this.navigator.returnToDay(this.params.date);
//                 } else {
//                     this.complete = true;
//                     return;
//                 }

        // if (paragraph) {
        //     const success = await this.navigator.tryProgressFrom(this.params.puzzlePart, paragraph);
        //     if (success) return;
        // }
        }
        return false;
    }

    async start() {
        const ts = moment.utc();
        const submitTimeoutSeconds = 60 * 60;  // 1h
        const sleepMilliseconds = 750;
        while (moment.utc().diff(ts, 'seconds', true) < submitTimeoutSeconds && !this.complete) {
            await new Promise(resolve => setTimeout(resolve, sleepMilliseconds));

            try {
                const standardOutput = await forkChildProcessEval(this.params);
                const maybeJson = parseJsonFromStandardOutputOrNull(standardOutput);
                if (maybeJson) {
                    const success = await this.trySubmit(maybeJson, standardOutput);
                    if (success) break;
                }
            }
            catch (err: any) {
                logger.error(`Eval error: ${err}`);
            }
        }
    }
}