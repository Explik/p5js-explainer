# p5.js Explainer
P5.js Explainer is an "automatic" code explanation tool. 
The tool is build as a personal project and is not associated with or endorsed by p5.js. 

The tool works by a 4 step process: 
1. It splits a code file into a series of code snippets. 
2. It generates prompts based on code snippets. Ex. What does "let x = 0;" mean? 
3. It sends the prompts to OpenAI and captures the responds
4. It processes the responds and use it to populate a Web UI

The resulting Web UI displays a line-for-line explanation incl. links of the code file. 

Demo: https://white-ocean-061ba6a10.5.azurestaticapps.net/

## Installation
1. Clone repository:
```
git clone https://github.com/Explik/p5js-explainer.git
cd p5-explainer
```

2. Install dependencies: 

```
npm install
```

3. Create environment file

Create an environment file `.env` in the project with the following content. 
```
OPENAI_API_MODEL_LARGE=gpt-4o
OPENAI_API_MODEL_SMALL=gpt-4o-mini
OPENAI_API_KEY=[INSERT_API_KEY_HERE]
```

## Usage
Web commands: 
- `npm run serve` - Starts an edit server
- `npm run serve-dev` - Starts an edit server with hot reloading of api and web changes
- `npm run build` - Builds static bundle for view-only server

CLI commands:
- `npm run cli -- generate GLOB_PATTERN` - Generates an .json (containing comments & references) for each .js file and an index for files matching the pattern
    - `--reprocess` - Reprocesses all files (ignores cache)
    - `--skip-comments` - Skips comments generation 
    - `--skip-references` - Skips references generation 
    - `--skip-index` - Skips index generation
    - `--skip-all` - Skips comment, reference, and index generation (only generates code snippets)

- `npm run cli -- generate-comments GLOB_PATTERN` - Generates/regenerates comments for all files
    - `--reprocess` - Reprocesses all files (ignores cache)

- `npm run cli -- generate-references GLOB_PATTERN` - Generates/regenerates references for all files
    - `--reprocess` - Reprocesses all files (ignores cache)

- `npm run cli -- generate-index GLOB_PATTERN` - Generates/regenerates index for all files
    - `--reprocess` - Reprocesses all files (ignores cache)

PLEASE NOTE, the CLI commands will overwrite existing files with the same name.
