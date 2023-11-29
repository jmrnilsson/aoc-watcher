import Protocol from "devtools-protocol";
import { Puzzle } from "./puzzle";
import ProtocolProxyApi from "devtools-protocol/types/protocol-proxy-api";
import AdventHistoryFile from './utils/advent-history-file';

export type AdventVariables = {
  execPath: string;
  module: string;
  puzzleFile: string;
  puzzleFolder: string;
}

export type ForkChildProcessForSolveEvalArguments = {
  date: YearDay;
  puzzle: Puzzle;
  execPath: string;
  module: string;
}

export type Explanation = "High" | "Low" | "Unknown" | "Success";

export type AdventSubmissionRecord = {
  year: number,
  day: number,
  part: number,
  explanation: Explanation,
  at: number,
  value: string
};

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

export type AutoResponderSubmissionMetrics = {
  seen: Set<string>;
  previousFaultAt: moment.Moment;
  max: number;
  min: number;
}

export type AutoResponderConstructorArguments = {
  runtime: ProtocolProxyApi.RuntimeApi;
  puzzle: Puzzle;
  date: YearDay;
  execPath: string;
  module: string;
  fileAccess: AdventHistoryFile
}
