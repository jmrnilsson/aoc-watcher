import * as fs from 'fs';
import { promises as fsp } from 'fs';
import { isNumeric } from './format';
import { AdventSubmissionRecord, AutoResponderSubmissionMetrics, YearDay } from '../types';
import moment from 'moment';
import { Puzzle } from '../puzzle';
import { _CONFIG_PATH } from './io';

export interface IAdventHistoryFile {
    initialize(): Promise<void>;
    save(record: AdventSubmissionRecord | null): Promise<void>
    find(puzzle: Puzzle, date: YearDay): AutoResponderSubmissionMetrics
    initialize(): Promise<void>;
}

export default class AdventHistoryFile implements IAdventHistoryFile {
    initialized: boolean = false;
    history: AdventSubmissionRecord[] = [];

    async initialize(): Promise<void> {
        try {
            if (!fs.existsSync(_CONFIG_PATH)) return;
            const records = JSON.parse((await fsp.readFile(_CONFIG_PATH, 'utf-8')).toString());
            for (const record of records) {
                this.history.push(record);
            }
        } finally {
            this.initialized = true;
        }
    }

    async save(record: AdventSubmissionRecord | null): Promise<void> {
        if (!this.initialized) throw new EvalError("File storage not read before writing.");
        if (record) this.history.push(record);
        return await fsp.writeFile(_CONFIG_PATH, JSON.stringify(this.history, null, 2), 'utf-8' );
    }
    
    public find(puzzle: Puzzle, date: YearDay): AutoResponderSubmissionMetrics {
        let previousFaultAt: moment.Moment = moment().utc().add(-2, 'hours');
        let min: number = -Infinity;
        let max: number = Infinity;
        const seen: Set<string> = new Set<string>();
        for (const r of this.history.filter((r) => r.year == date.year && r.day == date.day && puzzle.is(r.part))) {
            seen.add(r.value);
            const timestamp: moment.Moment = moment(r.at);

            if (timestamp > previousFaultAt && r.explanation !== "Success") {
                previousFaultAt = timestamp;
            }

            if (r.explanation === "Success" && r.part === 2) {
                throw new RangeError("Part 2 already completed per history.");
            }

            if (isNumeric(r.value)) {
                const numberValue: number = Number(r.value);
                if (r.explanation === "Low" && numberValue > min) min = numberValue;
                if (r.explanation === "High" && numberValue < max) max = numberValue;
            }
        }
        return { max, min, seen, previousFaultAt };
    }

}
