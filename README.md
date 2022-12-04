# AOC Watcher

Allows for an automated browser experience during `Advent of Code` submittions. Verified with [Firefox](https://www.mozilla.org/), [Brave](https://brave.com/), [Python](https://www.python.org/downloads/) and the latest [NodeJS LTS](https://nodejs.org/en/download/) only. If you prefer something else there are serveral [other tools](https://github.com/scarvalhojr/aoc-cli) that could be worth a try. 
- Dowloads the puzzle input.
- Polls a process and reads stardard output or standard error expecting JSON.
- Does a challange against any previous ones (if any).
- Submits and continues to part 2 if ok.

You will have to sign authenticate at some point. Might just do that in same browser that will run the debugger.

## Setup
Use `npm -i` with the latest [NodeJS LTS](https://nodejs.org/en/download/).
## Running

Start a browser with Chrome DevTools Protocol enabled but without headless option off (preferbly). Or customize and run `safari.sh`,
`firefox.ps1` or `./brave.ps1` to your needs. 

You'll have to setup some enviroment variables. As this was intended for Python interoperability via processes there 
are two variables to set. Here an example (on Windows) but you might just want to change the script used or use an
env-file.

> **Note:** Days will be padded with single digit zero fill (for now).

```pwsh
# Remove zfill days aren't padded. Kindly note that this is not your typical environment variable but template string
# using Mustasche.
$env:AOCW_PUZZLE_FILE = 'puzzle.txt'
$env:AOCW_PUZZLE_FOLDER = 'C:\\development\\aoc\\year_{{year}}\\day_{{day}}\\'
$env:AOCW_MODULE = 'C:\\development\\aoc\\year_{{year}}\\day_{{day}}\\solve.py'
$env:AOCW_EXEC = 'C:\\development\\aoc\\.venv\\Scripts\\python.exe'

# For awaiting "todays" puzzle:
node .\main.js

# Or a specific other day with:
node .\main.js "2022-12-01"
```

## Implementing support for puzzles answers
The watcher does interop via standard output from a user configured process. If the output conforms to the following JSON example it's evaluated. Anything else, including standard error, is logged in the console. 

```json
{
  "ok": true,
  "puzzle": 1475698
  "test": 42
}
```

## Additional notes
Advent of Code is a puzzle oriented calendar by [Eric Wastl](https://twitter.com/ericwastl) and other contributor. Please consider [supporting their work](https://adventofcode.com/2022/support).

This repository is provided under [MIT](LICENSE) and is not directly affillated with Advent of Code, Firefox, Brave, Safari, Chrome, NodeJS or any of libraries referenced.
