import * as fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'node:path';
import { spawn } from 'child_process';
import Mustache from 'mustache';
import { zfill } from './format';
import { logger } from './log';
import { AdventHistory, AdventHistoryFile, ForkChildProcessForSolveEvalArguments } from '../types';
import moment from 'moment';


const _CONFIG_PATH: string = ".aoc-watcher-storage.json";

export async function readHistory(): Promise<AdventHistory> {
    if (!fs.existsSync(_CONFIG_PATH)) return {};
    const data: AdventHistoryFile = JSON.parse((await fsp.readFile(_CONFIG_PATH, 'utf-8')).toString());
    const adventHistory: AdventHistory = {};
    for (const [yearDay, value] of Object.entries(data)) {
        const {previousFaultAtTimestamp, ...rest} = value as any;
        data[yearDay] = { ...rest, previousFaultAt: moment(previousFaultAtTimestamp) }
    }
    return adventHistory;
}

export async function writeHistory(adventHistory: AdventHistory): Promise<void> {
    const data: AdventHistoryFile = {};
    for (const [yearDay, value] of Object.entries(adventHistory)) {
        const {previousFaultAt, ...rest} = value;
        data[yearDay] = { ...rest, previousFaultAtTimestamp: previousFaultAt.unix() }
    }
    return await fsp.writeFile(_CONFIG_PATH, JSON.stringify(data, null, 2), {mode: 'utf-8'});
}

export async function writeFile(folder: string, fileName: string, content: string): Promise<void> {
    if (!fs.existsSync(folder)) {
        logger.info(`Creating dir: ${folder}`);
        fs.mkdirSync(folder, { recursive: true });
    }

    const fullName = path.join(folder, fileName);

    if (fs.existsSync(fullName)) {
        logger.info(`Truncate file: ${fullName}`);
        await fsp.truncate(fullName, 0);
    }
    await fsp.writeFile(fullName, content)
}

export function forkChildProcessForSolveEval(params: ForkChildProcessForSolveEvalArguments): Promise<string> {
    const args: string[] = [
        Mustache.render(params.module, {
            year: params.date.year,
            day: zfill(params.date.day, 2)
        }),
        params.puzzle.jsonSuffix
    ];

    return new Promise((resolve, reject) => {
        const cp = spawn(params.execPath, args);

        let content: string = '';
        let error: string = '';
        cp.stdout.setEncoding('utf8');
        cp.stdout.on('data', (chunk) => { content += chunk; });

        cp.stderr.setEncoding('utf8');
        cp.stderr.on('data', (err) => { error += err });

        cp.on('exit', () => { error ? reject(error) : resolve(content); });
    });
}