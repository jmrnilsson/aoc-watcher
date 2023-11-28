import { describe, expect, test} from '@jest/globals'
import { parseArgvToDate as parse, parseJsonFromStandardOutputOrNull as toJson, isNumeric } from './format';

describe("Year day argv parser", function () {
  test("can parse iso date", function () {
    const expectedYear = 2018;
    const expectedDay = 13;
    const {year, day} = parse(["", "", '2018-12-13']);
    expect(year).toBe(expectedYear);
    expect(day).toEqual(expectedDay);
  });
  
  test("can parse YYYY-DD", function () {
    const expectedYear = 2023;
    const expectedDay = 24;
    const {year, day} = parse(["", "", '2023-24']);
    expect(year).toBe(expectedYear);
    expect(day).toEqual(expectedDay);
  });

  test("defaults to this year and day", function () {
    const {year, day} = parse([""]);
    expect(year).toBeGreaterThan(2019);
    expect(day).toBeGreaterThanOrEqual(1);
  });
});

describe("Regex", function () {
  test("finds specific json when multiple exists", function () {
    const standardOutput = `0.]]
      {"test": 13, "canons": 1, "ok": true}
      {"test": 13, "puzzle": 6314, "ok": true}
      7iasod 1`;

    const jsonOut = toJson(standardOutput);
    expect(jsonOut).toEqual({ "test": 13, "puzzle": 6314, "ok": true });
  });
  
  test("json from mixed standard output", function () {
    const standardOutput = '{{"test": 13, "puzzle": 6314, "ok": true}}';
    const jsonOut = toJson(standardOutput);
    expect(jsonOut).toEqual({"test": 13, "puzzle": 6314, "ok": true});
  });

  test("json from live sample", function () {
    const standardOutput = '{"test": -6, "puzzle": 510, "ok": true}\r\n';
    const jsonOut = toJson(standardOutput);
    expect(jsonOut).toEqual({"test": -6, "puzzle": 510, "ok": true});
  });
});


describe("isNumeric", function () {
  const cases: [string, boolean][] = [
    ["1", true],
    ["1 ", false],
    [" 1", false],
    ["0912039", true],
    ["091a2039", false],
    ["Paretis", false]
  ];

  const casesSeparator: [string, boolean][] = [
    ["1.", true],
    ["1,1", true],
    ["Paretis", false]
  ];

  test.each(cases)("given %p returns %p", (value, expected) => {
    expect(isNumeric(value)).toBe(expected);
  });

  test.skip.each(casesSeparator)("given %p allowing separators returns %p", (value, expected) => {
    expect(isNumeric(value, true)).toBe(expected);
  });
});


