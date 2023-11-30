import { describe, expect, test} from '@jest/globals';
import { DOMParser } from '@xmldom/xmldom';

describe("AutoResponderBrowser", () => {
    describe.skip("DOMParser ", () => {
    
      test("returnToDay - Part 2", () => {
        let htmlContent = `<p>That's the right answer!  You are <span class="day-success">one gold star</span> `;
        htmlContent += `closer to fixing the sleigh. <a href="/2016/day/2#part2">[Continue to Part Two]</a></p>`;
        const dp = new DOMParser();
        const dom = dp.parseFromString(htmlContent, "text/xml");
        const actual = dom.querySelector('article > p > a[href*="/${year}/day/${day}"]');
      
        expect(actual).toBe("Explanation.High");
    });

    // That's the right answer! You are one gold star closer to fixing the sleigh. [Continue to Part Two]
    // <a href="/2016/day/2#part2">[Continue to Part Two]</a>
    // <p>That's the right answer!  You are <span class="day-success">one gold star</span> closer to fixing the sleigh. <a href="/2016/day/2#part2">[Continue to Part Two]</a></p>

  });
}); 
