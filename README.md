# milkman 🥛

A lightweight terminal UI for exploring and executing API requests from an OpenAPI spec. Built for developers who find Postman too heavy — milkman gives you the bits you actually use.

## Features

- **Import any OpenAPI 3.x spec** (YAML or JSON) and instantly browse all endpoints
- **Arrow-key TUI** — navigate endpoints, inspect parameters, and fire requests without leaving the terminal
- **Example values pre-filled** — request body and query params are populated from the spec's example values, so you can hit Enter and go
- **Executes via `curl`** — see the exact curl command that ran, get formatted JSON output with status code and latency
- **Per-project config** — base URL and collection stored in `.milkman/` alongside your project

## Requirements

- [Bun](https://bun.sh) v1.0+
- `curl` (available on macOS/Linux by default)

## Installation

```bash
git clone https://github.com/ajmccall/milkman.git
cd milkman
bun install
```

## Usage

### 1. Import an OpenAPI spec

```bash
bun src/index.tsx import path/to/openapi.yaml
```

Parses the spec, writes the collection to `.milkman/`, and launches the TUI.

### 2. Set your base URL

```bash
bun src/index.tsx config url https://api.example.com
```

Or press `c` inside the TUI.

### 3. Launch the TUI

```bash
bun src/index.tsx
```

## TUI controls

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate endpoint list |
| `↵` | Select endpoint / confirm |
| `b` / `esc` | Go back |
| `i` | Import a new OpenAPI file |
| `c` | Change base URL |
| `q` | Quit |

## How it works

```
milkman import spec.yaml
  → parses OpenAPI paths, methods, parameters, request bodies
  → resolves $ref pointers and allOf schemas
  → writes .milkman/collection.json and .milkman/config.json

TUI: select endpoint
  → shows method, path, summary, parameters and body fields
  → prompts for required inputs (pre-filled with spec examples)
  → builds and runs: curl -s -X POST "https://..." -d '{"key":"value"}'
  → displays formatted JSON response with status code and latency
```

## Project structure

```
src/
  index.tsx          # CLI entry point
  types.ts           # shared TypeScript types
  lib/
    parser.ts        # OpenAPI → collection converter
    storage.ts       # .milkman/ read/write
    executor.ts      # curl command builder + runner
    format.ts        # JSON formatting and colour helpers
  tui/
    App.tsx          # root ink component, view state machine
    ListView.tsx     # scrollable endpoint list
    DetailView.tsx   # endpoint detail (params, body schema)
    ParamInputView.tsx  # required param prompts before execution
    ResponseView.tsx    # response display
    PromptView.tsx      # generic text prompt (import / config)
.milkman/
  config.json        # base URL
  collection.json    # parsed endpoint collection
```

## Tech stack

- [Bun](https://bun.sh) — runtime and package manager
- [ink](https://github.com/vadimdemedes/ink) — React for CLIs
- [yaml](https://github.com/eemeli/yaml) — OpenAPI YAML parsing
- [chalk](https://github.com/chalk/chalk) — terminal colours

## Local config

`.milkman/` is intentionally per-project (not global), so each repo can have its own base URL and collection. Add it to your `.gitignore` if you don't want to commit it.
