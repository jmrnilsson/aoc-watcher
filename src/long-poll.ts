import moment from 'moment';
import { logger } from './utils/log';
import { LongPollArguments } from './types';


export async function longPoll(params: LongPollArguments) {
  params.log ??= false;
  const ts = moment.utc();
  while (moment.utc().diff(ts, 'seconds', true) < params.timeoutSeconds) {
    if (params.log) logger.info(`Long-polling: ${params.sleep}ms`);
    await new Promise(resolve => setTimeout(resolve, params.sleep));
    const result = await params.fn();
    if (params.breakPredicate(result)) break;
  }
}
