
export type InteropPart = "-json1" | "-json2";

export type YearDay = {
  year: number;
  day: number;
}

export type PuzzlePart = 1 | 2;

export class AdventError extends Error {
  constructor(message: string) {
    super(message);
  }
}