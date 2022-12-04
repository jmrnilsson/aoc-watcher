const fs = require('fs');
const path = require('node:path');
const { spawn } = require('child_process');
const Mustache = require('mustache');
const { zfill } = require('./format');
const { logger } = require('./log');


function _writeFile(fileName, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, content, "utf-8", (err, bytesWritten, _) => {
      if (err) reject(err);
      logger.info(`Writing file: ${fileName}. Bytes written: ${bytesWritten}`);
      resolve();
    });
  });
}

function _truncate(fullName) {
  return new Promise((resolve, reject) => {
    fs.truncate(fullName, 0, function (err) {
      if (err) reject(err);
      resolve();
    });
  });
}

async function _createFoldersOverwriteOrCreateFile(folder, fileName, content) {
  if (!fs.existsSync(folder)) {
    logger.info(`Creating dir: ${folder}`);
    fs.mkdirSync(folder, { recursive: true });
  }

  const fullName = path.join(folder, fileName);

  if (fs.existsSync(fullName)) {
    logger.info(`Truncate file: ${fullName}`);
    await _truncate(fullName)
  }
  await _writeFile(fullName, content)
}

function _fork_solve(year, day, flag, execPath, module){
  const flag_ = flag || '-json1';
  let args = [Mustache.render(module, {year: year, day: zfill(day, 2)}), flag_];
 
  return new Promise((resolve, reject) => {
    const childProcess = spawn(execPath, args);

    var content = '';
    var error = '';
    childProcess.stdout.setEncoding('utf8');
    childProcess.stdout.on('data', (chunk) => { content += chunk; });
  
    childProcess.stderr.setEncoding('utf8');
    childProcess.stderr.on('data', (err) => { error += err });
  
    childProcess.on('exit', () => { error ? reject(error) : resolve(content); });
  });
}

function _requestPromise(options) {
  return new Promise ((resolve, reject) => {
      const request = https.request(options, response => {
          var content = '';
  
          response.on('data', function (chunk) {
              content += chunk;
          });
          
          response.on('end', function () {
              resolve(content);
          });    
      });

      try {
          request.end();
      }
      catch(err){
          reject(err);
      }
  }); 
}

exports.writeFilePromise = _createFoldersOverwriteOrCreateFile;
exports.fork_solve = _fork_solve;
// exports.requestPromise = _requestPromise; Supported, but not needed since we need attached credentials.