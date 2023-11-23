import moment from 'moment';
import {ProtocolProxyApi} from 'devtools-protocol/types/protocol-proxy-api'
import CDP from 'chrome-remote-interface';
import { logger } from './utils/log';
import { forkChildProcessForSolveEval as forkChildProcessEval } from './utils/io';
import { findJsonFromOutput as tryParseJsonFromStandardOutput, isNumeric } from './utils/format';
import { PuzzlePart, YearDay } from './types';

type AutoResponderConstructorArguments = {
    puzzlePart: PuzzlePart;
    date: YearDay;
    execPath: string;
    module: string;
}

export class AutoResponder {
  private readonly runtime: ProtocolProxyApi.RuntimeApi;
  private readonly params: AutoResponderConstructorArguments;
  private readonly seen: Set<string>;
  private max: number
  private min: number;
  private faultAt: moment.Moment;

  constructor(client: CDP.Client, params: AutoResponderConstructorArguments) {
      // @ts-ignore
      this.runtime = client.Runtime;
      this.params = params;
      this.seen = new Set<string>();
      this.max = Infinity,
      this.min = -Infinity;
      this.faultAt = moment([2010, 1, 1]);
  }

  private async evalHtml(answer: string) {
      const Runtime = this.runtime;
      const {year, day} = this.params.date;
      const puzzleResponse = 'document.querySelector("p").textContent;';
      const returnToDay = `document.querySelector('a[href="/${year}/day/${day}]').click();`;
      const typeInput = `document.querySelector('input[name="answer"]').value = "${answer}";`;
      const submit = `document.querySelector('input[type="submit"]').click();` 
      const hasNext = `document.querySelector("a[href*='part2']");`
      const next = `document.querySelector("a[href*='part2']").click();`
      const p = await Runtime.evaluate({ expression: puzzleResponse });
      const {type, value} = p.result;
      let correct = true;
      if (type == 'string'){
          if (value.includes("not the right answer")){
              correct = false;
              this.seen.add(answer);
              this.faultAt = moment.utc();
              if (value.includes("answer is too high")){
                  logger.info(`***** Answer was too high *****`);    
                  if (isNumeric(answer)) {
                      this.max = Math.max(Number(answer), this.max);
                  }
              }
              else if (value.includes("answer is too low")){
                  logger.info(`***** Answer was too low *****`);
                  if (isNumeric(answer)) {
                      this.min = Math.min(Number(answer), this.min);
                  }
              }
              else {
                  logger.info(`***** Answer was wrong *****`);
              }
              await Runtime.evaluate({ expression: returnToDay });
              return false;
          }
          else{          
              await Runtime.evaluate({ expression: typeInput });
              await Runtime.evaluate({ expression: submit });
              if (await Runtime.evaluate({ expression: hasNext })) await Runtime.evaluate({ expression: next });
          }
      }
      return true;
  }

  async start(){
      const ts = moment.utc();
      const pollAnchorTimeoutSeconds = 60 * 60;
      const respondMinimumWait = 31;
      const sleep = 750;
      while (moment.utc().diff(ts, 'seconds', true) < pollAnchorTimeoutSeconds){
          await new Promise(resolve => setTimeout(resolve, sleep));
  
          try {
              let output = await forkChildProcessEval(this.params);
              const maybeJson = tryParseJsonFromStandardOutput(output);
              
              if (maybeJson){
                  let {ok, puzzle, test} = maybeJson
                  logger.info(`\n${output}`);
                  if (ok == true){
                      if (this.seen.has(puzzle)){
                          logger.info(`***** Already seen ${puzzle}. *****`);
                          continue;
                      }
                      if (puzzle <= this.min){
                          logger.info(`***** ${puzzle} is too low. *****`);
                          continue;
                      }
                      if (puzzle >= this.max){
                          logger.info(`***** ${puzzle} is too high. *****`);
                          continue;
                      }
                      const waitTime = moment.utc().diff(this.faultAt, 'seconds', true);
                      const sleep = Math.max(Math.min(respondMinimumWait - waitTime, respondMinimumWait * 0.1), 0);
                      logger.info(`***** Will commit ${this.params.puzzlePart}: ${puzzle} after ${sleep}s. *****`);
                      await new Promise(resolve => setTimeout(resolve, sleep));
                      const success = await this.evalHtml(puzzle);
                      if (success) return puzzle;
                  }
              }
          }
          catch(err){
              logger.error(`Eval error: ${err}`);
          }
      }   
  }
}