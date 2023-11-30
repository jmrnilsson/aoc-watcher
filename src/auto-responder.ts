import { hrtime } from 'node:process';
import { logger } from './utils/log';
import { forkChildProcessForSolveEval as forkChildProcessEval } from './utils/io';
import { parseJsonFromStandardOutputOrNull, isNumeric } from './utils/format';
import AutoResponderBrowser from './auto-responder-browser';
import { AdventError, AutoResponderConstructorArguments, Explanation } from './types';


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
    Twenty = 20,
    Thirty = 30,
    Fourty = 40,
    Fifty = 50,
    Sixty = 60,
    Seventy = 70,
    Eighty = 80,
    Ninety = 90
}

export class AutoResponder {
    private readonly browser: AutoResponderBrowser;
    private readonly params: AutoResponderConstructorArguments;
    private readonly seen: Set<string> = new Set<string>();
    private max: number = Infinity
    private min: number = -Infinity;
    private lastSubmissionAt: bigint  = hrtime.bigint() - (1_000_000_000n * 60n * 60n);
    private lastPleaseWaitSeconds: bigint = 0n;

    constructor(params: AutoResponderConstructorArguments) {
        this.browser = new AutoResponderBrowser(params.runtime, params.date);
        this.params = params;
    }

    private skipByTriage(answer: string): boolean {
        if (isNumeric(answer)) {
            const answer_ = Number(answer);
            if (answer_ <= this.min) {
                logger.info(`***** Triage: ${answer} is too low! Min: ${this.min} *****`);
                return true
            }
            if (answer_ >= this.max) {
                logger.info(`***** Triage: ${answer} is too high! Max: ${this.max} *****`);
                return true
            }
        }
        if (this.seen.has(answer)) {
            logger.info(`***** Triage: Already tried ${answer}! *****`);
            return true;
        }

        const waitedSeconds: bigint = (hrtime.bigint() - this.lastSubmissionAt) / 1_000_000_000n;
        if (waitedSeconds > this.lastPleaseWaitSeconds){
            const secondsLeft: bigint = waitedSeconds - this.lastPleaseWaitSeconds;
            logger.info(`***** Triage: OK, but WAIT ${answer} for ${secondsLeft} seconds. *****`);
            return false;
        }
        logger.info(`***** Triage: OK, promoting ${answer}! *****`);
        return false;
    }

    private pleaseWaitSeconds(paragraph: string, defaultWaitSeconds: number): number {
        {
            const matches = /[Yy]ou have (?<minutes>\w+)m (?<seconds>\w+)s left to wait/.exec(paragraph);
            const minutes = matches?.groups?.minutes;
            const seconds = matches?.groups?.seconds;

            if (minutes && seconds) return Number(minutes) * 60 + Number(seconds);
        }

        const matches = /[Pp]lease wait (?<amount>\w+) (?<unit>\w+) before trying again/.exec(paragraph);
        const amount = matches?.groups?.amount;
        const unit = matches?.groups?.unit;

        if (unit && amount) {
            let k: number = 60;
            if (/second/.test(unit)) k = 1;
            if (/hour/.test(unit)) k = 60 * 60;

            let amountValue: null | number = null;
            if (/\d+/.test(amount)) amountValue = Number(amount);
            else {
                const amountInvariant: string = amount.slice(0, 1).toUpperCase() + amount.slice(1).toLowerCase();
                const amountNumber: Numbers = Numbers[amountInvariant as keyof typeof Numbers]
                amountValue = amountNumber.valueOf()                    
            }
            return amountValue * k;
        }
        logger.error("Unknown unit. Amount: %s, Unit: %s", amount, unit);
        return defaultWaitSeconds;
    }

    // Public for unit testing purposes.
    public explain(paragraph: string, answer: string): Explanation {
        if (/not the right answer|[Yy]ou gave an answer too recently/.test(paragraph)) {
            if (isNumeric(answer)) {
                if (paragraph.includes("answer is too high")) {
                    return Explanation.High;
                }
                else if (paragraph.includes("answer is too low")) {
                    return Explanation.Low;
                }
            }

        } else if (/(That's the right answer|You've finished every puzzle)/i.test(paragraph)) {
            return Explanation.Success;
        }
        return Explanation.Unknown;
    }

    private async submit(maybeJson: any, output: string): Promise<boolean> {
        const { ok, puzzle } = maybeJson;
        logger.info(`\n${output}`);

        if (ok !== true) return false;

        if (this.skipByTriage(puzzle)) return false;

        await this.browser.submit(puzzle);
        const paragraph = await this.browser.getResponseParagraph();
        this.lastSubmissionAt = hrtime.bigint();

        if (!paragraph) return false;
        this.seen.add(puzzle);
        const explanation = this.explain(paragraph, puzzle);

        switch (explanation) {
            case Explanation.Success:
                logger.info(`***** Success with part ${this.params.puzzle.part} *****`);
                await this.browser.returnToDay({noop: false});
                return true;
            case Explanation.High: this.max = Math.max(Number(puzzle), this.max);
            case Explanation.Low: this.min = Math.min(Number(puzzle), this.min);
            case Explanation.Unknown:
                await this.browser.returnToDay({noop: true});
                this.lastPleaseWaitSeconds = BigInt(this.pleaseWaitSeconds(paragraph, 180));
                break;
            default:
                throw new AdventError(`Enumeration of explanation: ${explanation} not possible!`);
        }

        return false;
    }

    async start() {
        let success: boolean = false;
        const ts: bigint = hrtime.bigint();
        const submitTimeoutSeconds: bigint = 60n * 60n;  // 1h
        const sleepMilliseconds = 750;
        while (!success) {
            const duration: bigint = (hrtime.bigint() - ts) / 1_000_000_000n;
            if (duration >= submitTimeoutSeconds) break;
            
            await new Promise(resolve => setTimeout(resolve, sleepMilliseconds));

            try {
                const standardOutput = await forkChildProcessEval(this.params);
                const maybeJson = parseJsonFromStandardOutputOrNull(standardOutput);
                if (maybeJson) {
                    success = await this.submit(maybeJson, standardOutput);
                    if (success) break;
                }
            }
            catch (err: any) {
                logger.error(`Eval error: ${err}`);
            }
        }
    }
}