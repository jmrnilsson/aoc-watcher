import { AdventSubmissionRecord, AutoResponderSubmissionMetrics, YearDay } from '../../types';
import moment from 'moment';
import { Puzzle } from '../../puzzle';
import { type IAdventHistoryFile } from '../advent-history-file';

export default class FakeAdventHistoryFile implements IAdventHistoryFile {
    initialized: boolean = false;
    history: AdventSubmissionRecord[] = [];

    async initialize(): Promise<void> {
        this.initialized = true;
    }

    async save(record: AdventSubmissionRecord | null): Promise<void> {
        await new Promise(resolve => setImmediate(resolve));
    }
    
    public find(puzzle: Puzzle, date: YearDay): AutoResponderSubmissionMetrics {
        let previousFaultAt: moment.Moment = moment().utc().add(-2, 'hours');
        return { max: 1, min: -1, seen: new Set<string>(), previousFaultAt };
    }

}
