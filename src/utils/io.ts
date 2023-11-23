import * as fs from 'fs';
import { promises as fsp} from 'fs';
import path from 'node:path';
import { spawn } from 'child_process';
import Mustache from 'mustache';
import { zfill } from './format';
import { logger } from './log';


// function _writeFile(fileName: string, content) {
//   return new Promise((resolve, reject) => {
//     fs.writeFile(fileName, content, "utf-8", (err, bytesWritten, _) => {
//       if (err) reject(err);
//       logger.info(`Writing file: ${fileName}.`);
//       resolve();
//     });
//   });
// }

// function _truncate(fullName: string) {
//   return new Promise((resolve, reject) => {
//     fsp.truncate(fullName, 0, function (err) {
//       if (err) reject(err);
//       resolve();
//     });
//   });
// }

export async function writeFilePromise(folder: string, fileName: string, content: string): Promise<void> {
  if (!fs.existsSync(folder)) {
    logger.info(`Creating dir: ${folder}`);
    fs.mkdirSync(folder, { recursive: true });
  }

  const fullName = path.join(folder, fileName);

  if (fs.existsSync(fullName)) {
    logger.info(`Truncate file: ${fullName}`);
    await fsp.truncate(fullName, 0);
  }
  await fsp.writeFile(fullName, content)
}

export function fork_solve(year: number, day: number, flag: InteropPart, execPath: string, module: string): Promise<string>{
  const flag_: InteropPart = flag || '-json1';
  let args: string[] = [Mustache.render(module, {year: year, day: zfill(day, 2)}), flag_];
 
  return new Promise((resolve, reject) => {
    const cp = spawn(execPath, args);

    let content: string = '';
    let error: string = '';
    cp.stdout.setEncoding('utf8');
    cp.stdout.on('data', (chunk) => { content += chunk; });
  
    cp.stderr.setEncoding('utf8');
    cp.stderr.on('data', (err) => { error += err });

    cp.on('exit', () => { error ? reject(error) : resolve(content); });
  });
}

// function _requestPromise(options) {
//   return new Promise ((resolve, reject) => {
//       const request = https.request(options, response => {
//           var content = '';
  
//           response.on('data', function (chunk) {
//               content += chunk;
//           });
          
//           response.on('end', function () {
//               resolve(content);
//           });    
//       });

//       try {
//           request.end();
//       }
//       catch(err){
//           reject(err);
//       }
//   }); 
// }

// exports.fork_solve = _fork_solve;
// exports.requestPromise = _requestPromise; Supported, but not needed since we need attached credentials.