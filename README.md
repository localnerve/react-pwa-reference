# react-pwa-boilerplate

> A project boilerplate for universal reactiflux progressive web applications.

## WIP

> Working, but a work in progress.

## Prerequisites
Just Node.
* At least Node 4 LTS, recommend 5+, [nvm](https://github.com/creationix/nvm)

## Stack
* **N**ode
* **E**xpress
* **R**eact (Facebook)
* **F**luxible (Yahoo)
* sw-toolbox, sw-precache (Google)
* babel6, gulp4, eslint, mocha, chai, sass

## Setup
1. `git clone https://github.com/localnerve/react-pwa-boilerplate`
2. `npm install`

## Run

### Run Production
1. `npm run build:assets && npm run build:output`
2. `npm start`

### Run Development

| command | description |
| :--- | :--- |
| `npm run build:list` | dump the asset build task tree to console |
| `npm run config:dev` | dump the development config to console |
| `npm run config:prod` | dump the production config to console |
| `npm run dev` | lint, build assets, start the server, verbose, NODE_ENV=development |
| `npm run dev:analyze` | analyze webpack stats file and dump bundle size analysis to console |
| `npm run dev:ccss` | build css assets, watch and recompile sass on change |
| `npm run dev:debug` | lint, build assets, start the server, NODE_ENV=development, wait debugger attach |
| `npm run dev:perf` | lint, build assets, scripts w/source maps, start server, NODE_ENV=production |
| `npm run dev:prod` | lint, build assets, start server, NODE_ENV=production |
| `npm run fixtures:dev` | build test fixtures from data service, development |
| `npm run fixtures:prod` | build test fixtures from data service, production |
| `npm run lint` | run linter on entire project |
| `npm run perfbudget` | used by CI to test performance budget against service |
| `npm run test` | run the entire test suite |
| `npm run test:cover` | run the entire test suite, capture coverage, and report |
| `npm run test:debug` | build with source maps, start the test suite, wait debugger attach |
| `npm run test:func` | used by CI to run functional tests against selenium grid |
