const moment = require('moment');

function _zfill(digits, n){
  if (n > 7) throw Error(`Larger zero fills not supported (n=${n})`);
  return('000000000000' + digits).slice(-n);
}

function parseArgv(argv){
  let day = moment.utc().local();
  if (argv.slice(2).length > 0){
      day = argv[2].length > 7 ? moment(argv[2], 'YYYY-MM-DD') : moment(argv[2], 'YYYY-DD');
  }
  var year = day.year();
  var day_ = day.date();
  return [year, day_];
}

function findJsonFromOutput(output) {
  let re = new RegExp(/{[\w- \"\':,]+(uzzle)[\w- \"\':,]+}/g);
  let match = re.exec(output);
  return match ? JSON.parse(match[0]) : null;
}

exports.zfill = _zfill;
exports.parseArgv = parseArgv;
exports.findJsonFromOutput = findJsonFromOutput;

