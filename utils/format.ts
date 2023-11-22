import moment from 'moment';

export function zfill(digits: number, n: number){
  if (n > 7) throw Error(`Larger zero fills not supported (n=${n})`);
  return('000000000000' + digits).slice(-n);
}

export function parseArgv(argv: string[], at: number = 2): [number, number] {
  let day: moment.Moment = moment.utc().local();
  const dateArg: string = argv[at];
  if (dateArg){
      day = dateArg.length > 7 ? moment(dateArg, 'YYYY-MM-DD') : moment(dateArg, 'YYYY-DD');
  }
  return [day.year(), day.date()];
}

export function findJsonFromOutput(output: string) {
  let re = new RegExp(/{[\w- \"\':,]+(uzzle)[\w- \"\':,]+}/g);
  let match = re.exec(output);
  return match ? JSON.parse(match[0]) : null;
}


export function isNumeric(value: string, allowSeparator: boolean = false) {
  const pattern = allowSeparator ? /^(\d\.,)+$/ : /^\d+$/;
  return pattern.test(value) && !isNaN(parseFloat(value));
}
