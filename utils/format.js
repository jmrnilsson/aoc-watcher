function _zfill(digits, n){
  if (n > 7) throw Error(`Larger zero fills not supported (n=${n})`);
  return('000000000000' + digits).slice(-n);
}

exports.zfill = _zfill;