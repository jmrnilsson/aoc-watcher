# 🎁🎄 AoC 🤶 Watcher 🎄 🎁

Allows for an automated browser experience during `Advent of Code` subsmissions. Verified with [Python](https://www.python.org/downloads/) interop and the current LTS [NodeJS](https://nodejs.org/en/download/). If you prefer something else there are serveral other tools that could be worth a try. Examples are listed below. Built with [Chrome Remote Interface](https://www.npmjs.com/package/chrome-remote-interface) and Javascript.

The following configurations have been verified or documented as unsupported.

| OS  | Browser | Verified |
|------|------|------|
| Windows  | Firefox | ✅ 2022-12-04 |
| Windows  | Brave | ✅ 2022-12-04 |
| MacOS  | Firefox | ❌ 2022-12-05: Firefox doesn't allow for Javascript injection. |
| MacOS  | Brave | ❌ 2022-12-05: Permission required for disk write but `node-mac-permissions` don't build. |

## ⭐ Basic outline
- Awaits todays puzzle by long-polling the DOM. No additional HTTP requests.
- Navigates to puzzle once available.
- Downloads the puzzle input.
- Long-polls a process standard output and attempts a JSON extract.
- Prints any pending errors while coding.
- Submits and continues to part 2.
- Skips if a previous submission was correct.
- In-process prevention against duplicate submissions.
- Keeps track of bounds for failed submissions ("too high" or "low" answers), yet again in-process.

The browser will have to authenticate at some point. Might just do that in same browser that will run the debugger.

## ⭐ Tasks
| Purpose  | Browser | Comment |
|------|------|------|
| Install  | `npm i` | |
| Test  | `npm test` | Runner provided by jasmine |
| Starting browser  | `./brave.ps1` | `firefox.ps1` and `chrome.sh` also available but may have to be modified to match path. |
| Running today  | `node .\main.js` | Requires a debuggable browser and enviroment variables (see below). |
| Running some other day  | `node .\main.js "2022-11"` |  Requires a debuggable browser and enviroment variables (see below). |

### ⭐ Notes on running
Some environment variables needs to be set. Here an example (on Windows) but you might just want to change the script used or use an
env-file. Days will be padded with single digit zero fill (for now). *On Windows I prefer to copy variables into a Powershell script.*

```pwsh
# Kindly take note of employed Mustasche template string.
$env:AOCW_PUZZLE_FILE = 'puzzle.txt'
$env:AOCW_PUZZLE_FOLDER = 'C:\\development\\aoc\\year_{{year}}\\day_{{day}}\\'
$env:AOCW_MODULE = 'C:\\development\\aoc\\year_{{year}}\\day_{{day}}\\solve.py'
$env:AOCW_EXEC = 'C:\\development\\aoc\\.venv\\Scripts\\python.exe'
```

## ⭐ Implementing support for puzzles answers
The watcher does interop via standard output from a user configured process. If the output contains a flat JSON
dictionary with the word `uzzle` in the message it it's results will processed. It generally must also conform to the
example below.

```json
{
  "ok": true,
  "puzzle": 1475698
  "test": 42
}
```

## ⭐ Additional notes
Advent of Code is a puzzle oriented calendar by [Eric Wastl](https://twitter.com/ericwastl) and other contributors. Please consider [supporting their work](https://adventofcode.com/2022/support).

This repository is provided under [MIT](LICENSE) and isn't directly affiliated with Advent of Code, Firefox, Brave, Safari or Chrome. Any referenced libraries are licensed separately.

### ⭐ Other tools
These are example of other Advent of Code tools for puzzle download or answer submission. I do not recommended or condone their use. 
- https://github.com/scarvalhojr/aoc-cli
- https://github.com/wimglenn/advent-of-code-data
- https://github.com/gobanos/aoc-runner

