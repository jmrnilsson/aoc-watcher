import moment, { Moment } from 'moment';
import { logger } from './utils/log';
import { forkChildProcessForSolveEval as forkChildProcessEval } from './utils/io';
import AdventHistoryFile from './utils/advent-history-file';
import { parseJsonFromStandardOutputOrNull, isNumeric } from './utils/format';
import AutoResponderNavigator from './auto-responder-navigator';
import {  AutoResponderConstructorArguments, Explanation } from './types';


type SubmissionExplanation = {
    waitSeconds: number;
    explanation: Explanation;
    at: number;
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
    private readonly navigator: AutoResponderNavigator;
    private readonly params: AutoResponderConstructorArguments;
    private readonly seen: Set<string>;
    private max: number
    private min: number;
    private previousFaultAt: moment.Moment;
    private waitSeconds: number = 0;
    private fileAccess: AdventHistoryFile;

    constructor(params: AutoResponderConstructorArguments) {
        this.navigator = new AutoResponderNavigator(params.runtime, params.date);
        this.params = params;
        this.seen = new Set<string>();
        // this.seen.add("69643")
        // this.seen.add("3")

        this.fileAccess = params.fileAccess;
        const metrics = this.fileAccess.find(params.puzzle, params.date);
        this.max = metrics.max;
        // this.max = 69643;
        this.min = metrics.min;
        // this.min = 8;
        this.previousFaultAt = metrics.previousFaultAt;
    }



    private skipByTriage(answer: string): boolean {
        if (isNumeric(answer)) {
            const answer_ = Number(answer);
            if (answer_ <= this.min) {
                logger.info(`***** Triage: ${answer} is too low! Min: ${this.min } *****`);
                return true
            }
            if (answer_ >= this.max) {
                logger.info(`***** Triage: ${answer} is too high! Max: ${ this.max } *****`);
                return true
            }
        }
        if (this.seen.has(answer)) {
            logger.info(`***** Triage: Already tried ${answer}! *****`);
            return true;
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
    public explain(paragraph: string, answer: string): SubmissionExplanation {
        const at: moment.Moment = moment.utc();
        let waitSeconds: number = 120;
        if (/not the right answer|[Yy]ou gave an answer too recently/.test(paragraph)) {
            this.seen.add(answer);
            this.previousFaultAt = at;

            waitSeconds = this.pleaseWaitSeconds(paragraph, waitSeconds);

            if (isNumeric(answer)) {
                if (paragraph.includes("answer is too high")) {
                    this.max = Math.max(Number(answer), this.max);
                    return { explanation: "High", waitSeconds, at: at.unix() };
                }
                else if (paragraph.includes("answer is too low")) {
                    this.min = Math.min(Number(answer), this.min);
                    return { explanation: "Low", waitSeconds, at: at.unix() };
                }
            }

        } else if (/(That's the right answer|You've finished every puzzle)/i.test(paragraph)) {
            return { explanation: "Success", waitSeconds: 0, at: at.unix() };
        }
        return { explanation: "Unknown", waitSeconds, at: at.unix() };
    }

    private async trySubmit(maybeJson: any, output: string): Promise<boolean> {
        const minSecondsToWait = 31;
        const { ok, puzzle } = maybeJson;
        logger.info(`\n${output}`);
        if (ok !== true) return false;

        const minUntil: Moment = this.previousFaultAt.add(minSecondsToWait, 'seconds');
        const until: Moment = this.previousFaultAt.add(this.waitSeconds, 'seconds');
        if (this.skipByTriage(puzzle)) return false;

        const minWait: number = minUntil.diff(moment.utc(), 'seconds');
        const wait: number =  until.diff(moment.utc(), 'seconds');
        if (wait < 0 && minWait < 0) {
            const waitSeconds = Math.min(wait, minWait);
            logger.info(`***** Will commit part ${this.params.puzzle.part}: ${puzzle} in ${waitSeconds}m. *****`);
            return false;
        }

        await this.navigator.submit(puzzle);
        const paragraph = await this.navigator.getResponseParagraph();
        if (!paragraph) return false;
        const { waitSeconds, explanation, at } = this.explain(paragraph, puzzle);
        await this.fileAccess.save({
            at,
            year: this.params.date.year,
            day: this.params.date.day,
            part: this.params.puzzle.part,
            explanation,
            value: puzzle
        });
        this.waitSeconds = waitSeconds;
        if (explanation === "Success") {
            logger.info(`***** Success with part ${this.params.puzzle.part} *****`);
            return true;
        }
        await this.navigator.returnToDay();
        return false;
    }

    async start() {
        let success: boolean = false;
        const ts = moment.utc();
        const submitTimeoutSeconds = 60 * 60;  // 1h
        const sleepMilliseconds = 750;
        while (moment.utc().diff(ts, 'seconds', true) < submitTimeoutSeconds && !success) {
            await new Promise(resolve => setTimeout(resolve, sleepMilliseconds));

            try {
                const standardOutput = await forkChildProcessEval(this.params);
                const maybeJson = parseJsonFromStandardOutputOrNull(standardOutput);
                if (maybeJson) {
                    success = await this.trySubmit(maybeJson, standardOutput);
                    if (success) break;
                }
            }
            catch (err: any) {
                logger.error(`Eval error: ${err}`);
            }
        }
    }
}