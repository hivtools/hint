## HINT Front End
js and sass source files and tests can be found in `./src`. Compiled files are written to `./public`.

### Generating type definitions
Type definitions are auto-generated based on the 
[hintr API schema](https://github.com/mrc-ide/hintr/tree/master/inst/schema). To 
re-generate types run 

    ./scripts/generate-types.sh <BRANCH_NAME>

From this directory

### Test
Run `npm test` to run tests locally using jest

### Compiling
- sass is compiled using gulp - this task can be triggered by running `npm run sass` 
- js is bundled using webpack - this task can be triggered by running `npm run js`

Or to compile both at once, `npm run build`
