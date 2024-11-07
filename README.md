# p5.js Explainer
Description to come...

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
OPENAI_API_MODEL=gpt-4o
OPENAI_API_KEY=[INSERT_API_KEY_HERE]
```

## Usage
Web commands: 
- `npm run serve` - Starts an edit server
- `npm run serve-dev` - Starts an edit server with hot reloading of api and web changes
- `npm run build` - Builds static bundle for view-only server

CLI commands:
- `npm run cli -- GLOB_PATTERN` - Generates an .json (containing comments & references) for each file and an index for files matching the pattern
- `npm run cli -- GLOB_PATTERN --skip-comments --skip-references` - Skips comments and references generation 
- `npm run cli -- GLOB_PATTERN --skip-index` - Skips index generation
- `npm run cli -- GLOB_PATTERN --skip-all` - Skips comment, reference, and index generation

PLEASE NOTE, the CLI commands will overwrite existing files with the same name.
