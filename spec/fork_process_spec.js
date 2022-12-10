


describe("A suite", function () {
  const stdOutExample = ` [0. 0. 0. 0. 0. 0.]]
    23: R 2
    [[0. 0. 0. 0. 0. 0.]
    [0. 0. 0. 0. 0. 0.]
    [0. 2. 1. 0. 0. 0.]
    [0. 0. 0. 0. 0. 0.]
    [0. 0. 0. 0. 0. 0.]]
    
    {"test": 13, "puzzle": 6314, "ok": true} 
    7iasod 1
    `;
  it("first regex finds json", function () {
    let re = new RegExp(/{"test": \w+, "puzzle": \w+, "ok": \w+}/g);
    let match = re.exec(stdOutExample);
    let obj = JSON.parse(match[0]);
    expect(obj).toEqual({ "test": 13, "puzzle": 6314, "ok": true });
  });
  it("second regex finds json", function () {
    let re = new RegExp(/{[\w \"\':,]+}/g);
    let match = re.exec(stdOutExample);
    let obj = JSON.parse(match[0]);
    expect(obj).toEqual({ "test": 13, "puzzle": 6314, "ok": true });
  });
  it("regex finds specific json", function () {
    const text = `0.]]
    {"test": 13, "canons": 1, "ok": true}
    {"test": 13, "puzzle": 6314, "ok": true}
    7iasod 1`;
    let re = new RegExp(/{[\w \"\':,]+(uzzle)[\w \"\':,]+}/g);
    let match = re.exec(stdOutExample);
    let obj = JSON.parse(match[0]);
    expect(obj).toEqual({ "test": 13, "puzzle": 6314, "ok": true });
  });
});

