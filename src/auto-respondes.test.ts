import { describe, expect, test} from '@jest/globals'
import { AutoResponder } from './auto-responder';
import ProtocolProxyApi from 'devtools-protocol/types/protocol-proxy-api';
import { PuzzlePart } from './types';

describe("AutoResponder", () => {
  const puzzlePart: PuzzlePart = 1;
  const ctorArgs = {
    runtime: jest.fn() as unknown as ProtocolProxyApi.RuntimeApi,
    puzzlePart: puzzlePart,
    date: { year: 2018, day: 5 },
    execPath: "",
    module: "",
    max: null,
    min: null,
    previousFaultAt: null
  };

  // That's not the right answer; your answer is too high.  If you're stuck, make sure you're using the full input data; there are also some general tips on the <a href="/2018/about">about page</a>, or you can ask for hints on the <a href="https://www.reddit.com/r/adventofcode/" target="_blank">subreddit</a>.  Please wait one minute before trying again. <a href="/2018/day/22">[Return to Day 22]</a>
  // textContent: That's not the right answer; your answer is too high. If you're stuck, make sure you're using the full input data; there are also some general tips on the about page, or you can ask for hints on the subreddit. Please wait one minute before trying again. [Return to Day 22]

  describe("Explain", () => {
    test("High and 1 mins", function () {
      let p = "That's not the right answer; your answer is too high. If you're stuck,";
      p += " subreddit. Please wait one minute before trying again. [Return to Day 22]";
      const responder = new AutoResponder(ctorArgs);
      const actual = responder.explain(p, "4321");
      
      expect(actual.explanation).toBe("High");
      expect(actual.waitSeconds).toBe(60);
    });

    test("Low and 2 mins", function () {
      let p = "That's not the right answer; your answer is too low. If you're stuck,";
      p += " subreddit. Please wait two minutes before trying again. [Return to Day 22]";
      const responder = new AutoResponder(ctorArgs);
      const actual = responder.explain(p, "4321");
      
      expect(actual.explanation).toBe("Low");
      expect(actual.waitSeconds).toBe(120);
    });

    test("Unknown and 3 mins", function () {
      let p = "That's not the right answer. If you're stuck,";
      p += " subreddit. Please wait three minutes before trying again. [Return to Day 22]";
      const responder = new AutoResponder(ctorArgs);
      const actual = responder.explain(p, "4321");
      
      expect(actual.explanation).toBe("Unknown");
      expect(actual.waitSeconds).toBe(120);
    });

  });
});
