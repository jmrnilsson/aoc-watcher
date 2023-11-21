import { jest, describe, it, expect} from '@jest/globals'
import { parseArgv, findJsonFromOutput } from './format.js';

describe("Year day argv parser", function () {
  it("can parse iso date", function () {
    const expectedYear = 2018;
    const expectedDay = 13;
    let [year, day] = parseArgv(["", "", '2018-12-13']);
    expect(year).toBe(expectedYear);
    expect(day).toEqual(expectedDay);
  });
  
  it("can parse YYYY-DD", function () {
    const expectedYear = 2023;
    const expectedDay = 24;
    let [year, day] = parseArgv(["", "", '2023-24']);
    expect(year).toBe(expectedYear);
    expect(day).toEqual(expectedDay);
  });

  it("defaults to this year and day", function () {
    let [year, day] = parseArgv([""]);
    expect(year).toBeGreaterThan(2019);
    expect(day).toBeGreaterThanOrEqual(1);
  });
});

describe("Regex", function () {
  it("finds specific json when multiple exists", function () {
    const standardOutput = `0.]]
      {"test": 13, "canons": 1, "ok": true}
      {"test": 13, "puzzle": 6314, "ok": true}
      7iasod 1`;

    let jsonOut = findJsonFromOutput(standardOutput);
    expect(jsonOut).toEqual({ "test": 13, "puzzle": 6314, "ok": true });
  });
  
  it("json from mixed standard output", function () {
    const standardOutput = '\{{"test": 13, "puzzle": 6314, "ok": true}}';
    let jsonOut = findJsonFromOutput(standardOutput);
    expect(jsonOut).toEqual({"test": 13, "puzzle": 6314, "ok": true});
  });

  it("json from live sample", function () {
    const standardOutput = '{"test": -6, "puzzle": 510, "ok": true}\r\n';
    let jsonOut = findJsonFromOutput(standardOutput);
    expect(jsonOut).toEqual({"test": -6, "puzzle": 510, "ok": true});
  });
});



