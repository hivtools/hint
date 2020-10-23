## HINT Front End
js and sass source files and tests can be found in `./src`. Compiled files are written to `./public`.

### Generating type definitions
Type definitions are auto-generated based on the 
[hintr API schema](https://github.com/mrc-ide/hintr/tree/master/inst/schema). To 
re-generate types run 

    ./scripts/generate-types.sh <BRANCH_NAME>

from this directory

### Testing
Tests are run with jest. Files with the suffix `.test.ts` are treated as unit tests, files 
with the suffix `.itest.ts` treated as integration tests. Config for each can be found in 
`jest.config.js` and `jest.integration.config.js`, respectively.
- run unit tests with `npm test` 
- run integration tests with `npm run integration-test` having first started the app and 
all dependencies by running `./scripts/run-dev-dependencies-for-integration-tests.sh` from this
directory

## Linting
On CI we run `eslint` and the build will fail if there are any errors. To check your code locally,
run `npm run lint`. We are using the basic Typescript and Vue recommendations. Our only custom rule is that
nested content under both the `<template>` and `<script>` tags in a Vue component should be indented by 4
spaces. We have IntelliJ project style files included in this repo, so making your code conform with indenting rules
is as simple as running IntelliJ's auto-formatting command (<kbd>ctrl + alt + l</kbd> in Linux)

### Compiling
- sass is compiled using gulp - this task can be triggered by running `npm run sass` 
- js is bundled using webpack - this task can be triggered by running `npm run js`

Or to compile both at once, `npm run build`
