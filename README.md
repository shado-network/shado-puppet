# Shadō Puppet

By Shadō Network.

This framework is a work in progress! Use at your own discretion.

## Installation

- Clone the `@shado-network/shado-puppet` repository and navigate into the new directory
- Run `pnpm install` to install the framework dependencies

## Configuration

- Create a new `.env` file in the root directory and update it with the correct config and secrets
  - See the `.env.template` file for reference
- Create a new puppet file inside the `./include/` folder
  - See the puppet example files for reference:
    - `./include/good.ts`
    - `./include/evil.ts`

## Getting started

Run the shado-puppet framework, in development or production mode, with your own puppet files. Or, try it with the supplied example puppets.

The `--puppets` argument expects one or more puppet ids that have been set in the puppet files.

```sh
# Development mode
pnpm dev --puppets="good,evil"

# Production mode
pnpm start --puppets="good,evil"
```
