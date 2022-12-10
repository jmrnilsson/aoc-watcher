const { findAndStripJsonFromOutput } = require('../utils/io.js');

describe("A suite", function () {
  it("regex finds specific json when multiple exists", function () {
    // let re = new RegExp(/{[\w \"\':,]+(uzzle)[\w \"\':,]+}/g);
    const expectedStrippedOutput = `0.]]
      {"test": 13, "canons": 1, "ok": true}
      
      7iasod 1`;
    const standardOutput = `0.]]
      {"test": 13, "canons": 1, "ok": true}
      {"test": 13, "puzzle": 6314, "ok": true}
      7iasod 1`;

    let [challange, output] = findAndStripJsonFromOutput(standardOutput);
    expect(challange).toEqual({ "test": 13, "puzzle": 6314, "ok": true });
    expect(output).toEqual(expectedStrippedOutput);
  });
  it("regex finds json from mixed standard output", function () {
    let re = new RegExp(/{[\w \"\':,]+(uzzle)[\w \"\':,]+}/g);
    const standardOutput = '{{"test": 13, "puzzle": 6314, "ok": true}}';
    const expectedStrippedOutput = '\{}';
    let challange = re.exec(standardOutput)[0];
    // let [challange, output] = findAndStripJsonFromOutput(standardOutput);
    // let match = re.exec(json);
    // let obj = JSON.parse(match[0]);
    expect(challange).toEqual('{"test": 13, "puzzle": 6314, "ok": true}');
    // expect(output).toEqual(expectedStrippedOutput);
  });
});

