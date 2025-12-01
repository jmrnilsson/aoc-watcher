import fs from 'fs';
import moment from 'moment';
import { AdventError, AdventVariables, StdOutEvalCapture, YearDay } from '../types';

export function zfill(digits: number, n: number) {
  if (n > 7) throw new AdventError(`Larger zero fills not supported (n=${n})`);
  return ('000000000000' + digits).slice(-n);
}

export function parseArgvToDate(argv: string[], at: number = 2): YearDay {
  let day: moment.Moment = moment.utc().local();
  const dateArg: string = argv[at];
  if (dateArg) {
    day = dateArg.length > 7 ? moment(dateArg, 'YYYY-MM-DD') : moment(dateArg, 'YYYY-DD');
  }
  return { year: day.year(), day: day.date() };
}

export function getEnvs(): AdventVariables {
  const vars = {
    execPath: process.env.AOCW_EXEC!,
    module: process.env.AOCW_MODULE!,
    puzzleFile: process.env.AOCW_PUZZLE_FILE!,
    puzzleFolder: process.env.AOCW_PUZZLE_FOLDER!
  };
  if (!Object.values(vars).every(v => !!v)) {
    throw new Error("Environment variables not set " + vars);
  }
  if (!/[\\/]$/.test(vars.puzzleFolder)) {
    throw new AdventError(`puzzleFolder should end with '/' ${vars}`)
  }
  if (!fs.existsSync(vars.execPath)) {
    throw new AdventError(`Executable doesn't exist. ${vars}`);
  }
  return vars;
}

export function matchStandardOutputOrNull(output: string): StdOutEvalCapture {
  const reTest = new RegExp(/^(.*)\(OK\)/gm);

  if (reTest.test(output)) {
    return { ok: false, puzzle: null };
  }

  let puzzle: string | null = null;
  const rePuzzle = new RegExp(/^(.*)\(N?\/?OK\)/gm);

  for (const match of rePuzzle.exec(output) ?? []) {
    puzzle = match;
  }

  if (puzzle === null) {
    return { ok: false, puzzle: null };
  }

  return { ok: true, puzzle: puzzle}
}

export function isNumeric(value: string, allowSeparator: boolean = false) {
  const pattern = allowSeparator ? /^(\d\.,)+$/ : /^\d+$/;
  return pattern.test(value) && !isNaN(parseFloat(value));
}
