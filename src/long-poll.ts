import Protocol from 'devtools-protocol';
import moment from 'moment';
import { logger } from './utils/log';


export type LongPollArguments = {
  fn: () => Promise<Protocol.Runtime.EvaluateResponse | boolean | undefined>;
  breakPredicate: (anchor: any) => boolean;
  sleep: number;
  timeoutSeconds: number;
  log: boolean;
}

export async function longPoll(params: LongPollArguments) {
  params.log ??= false;
  const ts = moment.utc();
  while (moment.utc().diff(ts, 'seconds', true) < params.timeoutSeconds) {
    if (params.log) logger.info(`Long-polling wait time: ${params.sleep}ms`);
    await new Promise(resolve => setTimeout(resolve, params.sleep));
    const result = await params.fn();
    if (params.breakPredicate(result)) break;
  }
}
