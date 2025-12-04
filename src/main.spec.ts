import { describe, test} from '@jest/globals'
import { start } from './main';

jest.mock('./utils/protocol', jest.fn().mockImplementation(() => {
  const clientMock = jest.fn().mockImplementation(() => {
    return {Runtime: jest.fn()}
  });
  return {attachChromeDevToolsProtocol: () => clientMock}
}));


describe.skip("Main.start", function () {
  let originalProcessEnv: any;
  
  beforeAll(() => {
    originalProcessEnv = process.env;
    process.env = {
      "AOCW_PUZZLE_FILE": "puzzle.txt",
      "AOCW_PUZZLE_FOLDER": "C:\\sources\\aoc\\year_{{year}}\\day_{{day}}\\",
      "AOCW_MODULE": "C:\\sources\\aoc\\year_{{year}}\\day_{{day}}\\solve_{{part}}.py",
      "AOCW_EXEC": "C:\\sources\\aoc\\.venv\\Scripts\\python.exe"
    };
  });

  afterAll(() => {
    process.env = originalProcessEnv;
  });

  test("can skip part 1", function () {
    start(["node.exe", "src/main.ts", "2018-02"]);
  });
  
});

