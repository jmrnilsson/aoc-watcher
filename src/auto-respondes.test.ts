import { describe, expect, test} from '@jest/globals'
import { AutoResponder, explain, pleaseWaitSeconds } from './auto-responder';
import ProtocolProxyApi from 'devtools-protocol/types/protocol-proxy-api';
import { Puzzle } from './puzzle';
import { AutoResponderConstructorArguments, Explanation } from './types';

describe("AutoResponder", () => {
  const ctorArgs: AutoResponderConstructorArguments = {
    runtime: jest.fn() as unknown as ProtocolProxyApi.RuntimeApi,
    puzzle: Puzzle.part1(),
    date: { year: 2018, day: 5 },
    execPath: "",
    module: ""
  };

  // That's not the right answer; your answer is too high.  If you're stuck, make sure you're using the full input data; there are also some general tips on the <a href="/2018/about">about page</a>, or you can ask for hints on the <a href="https://www.reddit.com/r/adventofcode/" target="_blank">subreddit</a>.  Please wait one minute before trying again. <a href="/2018/day/22">[Return to Day 22]</a>
  // That's the right answer! You are one gold star closer to fixing the sleigh. [Continue to Part Two]

  describe("Explain", () => {
    test("High and one minute", function () {
      let p = "That's not the right answer; your answer is too high. If you're stuck,";
      p += " subreddit. Please wait one minute before trying again. [Return to Day 22]";
      //       const actual_0 = pleaseWaitSeconds(p, 180);
      const actual = explain(p, "4321");
      const actual_0 = pleaseWaitSeconds(p, 180);
      
      expect(actual).toBe(Explanation.High);
      expect(actual_0).toBe(60);
    });

    test("Low and two minutes", function () {
      let p = "That's not the right answer; your answer is too low. If you're stuck,";
      p += " subreddit. Please wait two minutes before trying again. [Return to Day 22]";
      const actual = explain(p, "4321");
      const actual_0 = pleaseWaitSeconds(p, 180);
      
      expect(actual).toBe(Explanation.Low);
      expect(actual_0).toBe(120);
    });

    test("Unknown and 5 minutes", function () {
      let p = `That's not the right answer. If you're stuck, make sure you're using the full input data; there are `;
      p += `also some general tips on the about page, or you can ask for hints on the subreddit. Because you have `;
      p += `guessed incorrectly 4 times on this puzzle, please wait 5 minutes before trying again. (You guessed 2.)`;
      const actual_0 = pleaseWaitSeconds(p, 180);
      const actual = explain(p, "4321");
      
      expect(actual).toBe(Explanation.Unknown);
      expect(actual_0).toBe(5 * 60);
    });

    test("Too recent 1m 20s", function () {
      let p = `You gave an answer too recently; you have to wait after submitting an answer before trying again. You `;
      p += `have 1m 20s left to wait. [Return to Day 2]`;
            const actual_0 = pleaseWaitSeconds(p, 180);
      const actual = explain(p, "1234");
      
      expect(actual).toBe(Explanation.Unknown);
      expect(actual_0).toBe(80);
    });

    test("10 minutes", function () {
      let p = `That's not the right answer. If you're stuck, make sure you're using the full input data; there are `;
      p += `also some general tips on the about page, or you can ask for hints on the subreddit. Because you have `
      p += `guessed incorrectly 8 times on this puzzle, please wait 10 minutes before trying again. (You guessed 8.)`;
            const actual_0 = pleaseWaitSeconds(p, 180);
      const actual = explain(p, "1122");
      
      expect(actual).toBe(Explanation.Unknown);
      expect(actual_0).toBe(10 * 60);
    });

    test("Unknown and 3 mins", function () {
      let p = "That's not the right answer. If you're stuck,";
      p += " subreddit. Please wait three minutes before trying again. [Return to Day 22]";
            const actual_0 = pleaseWaitSeconds(p, 180);
      const actual = explain(p, "4321");
      
      expect(actual).toBe(Explanation.Unknown);
      expect(actual_0).toBe(180);
    });

    // That's not the right answer. If you're stuck, make sure you're using the full input data; there are also some general tips on the about page, or you can ask for hints on the subreddit. Because you have guessed incorrectly 10 times on this puzzle, please wait 10 minutes before trying again.

  });
}); 
