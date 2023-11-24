import * as fs from 'fs';
import { promises as fsp} from 'fs';
import path from 'node:path';
import { spawn } from 'child_process';
import Mustache from 'mustache';
import { zfill } from './format';
import { logger } from './log';
import { InteropPart, PuzzlePart, YearDay } from '../types';

export type ForkChildProcessForSolveEvalArguments = {
  date: YearDay; 
  puzzlePart: PuzzlePart;
  execPath: string;
  module: string;
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

export function forkChildProcessForSolveEval(params: ForkChildProcessForSolveEvalArguments): Promise<string>{
  const flag: InteropPart = params.puzzlePart === 1 ? '-json1' : '-json2';
  const args: string[] = [Mustache.render(params.module, {year: params.date.year, day: zfill(params.date.day, 2)}), flag];
 
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