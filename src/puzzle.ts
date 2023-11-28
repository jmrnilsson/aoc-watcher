export class Puzzle {
  private readonly _part: 1 | 2;
  private readonly _jsonSuffix: "-json1" | "-json2"

  private constructor(part: 1 | 2, jsonSuffix: "-json1" | "-json2") {
    this._part = part;
    this._jsonSuffix = jsonSuffix; 
  }

  public static part1() {
    return new Puzzle(1, "-json1");
  }
  
  public static part2() {
    return new Puzzle(2, "-json2");
  }

  get part() {
    return this._part;
  }

  get jsonSuffix() {
    return this._jsonSuffix;
  }

  public is(partNumber: 1 | 2): boolean {
    return this.part === partNumber;
  }
}