import Protocol from "devtools-protocol";
import { Puzzle } from "./puzzle";

export type AdventVariables = {
  execPath: string;
  module: string;
  puzzleFile: string;
  puzzleFolder: string;
}

// export type Explanation = "High" | "Low" | "Unknown" | "Success";
export enum Explanation {
  High,
  Low,
  Unknown,
  Success
}

export type YearDay = {
  year: number;
  day: number;
}

export class AdventError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export type LongPollArguments = {
  fn: () => Promise<Protocol.Runtime.EvaluateResponse | boolean | undefined>;
  breakPredicate: (anchor: any) => boolean;
  sleep: number;
  timeoutSeconds: number;
  log: boolean;
}

// TODO: Expand paths and parts later on
export type AutoResponderConstructorArguments = {
  puzzle: Puzzle;
  date: YearDay;
  execPath: string;
  module: string;
  part: number;
}

export type StdOutEvalCapture = {
  ok: true;
  puzzle: string;
} | {
  ok: false;
  puzzle: null;
}