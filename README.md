## HINT - HIV Indicators Tool
[![Build Status](https://travis-ci.com/mrc-ide/hint.svg?branch=master)](https://travis-ci.com/mrc-ide/hint)
[![codecov](https://codecov.io/gh/mrc-ide/hint/branch/master/graph/badge.svg)](https://codecov.io/gh/mrc-ide/hint)

[SpringBoot](https://spring.io/projects/spring-boot) Kotlin web app for interfacing with the [Naomi model](https://github.com/mrc-ide/naomi-dev) for joint small-area estimation of HIV prevalence, ART coverage, and HIV incidence via the [hintr package](https://github.com/mrc-ide/hintr)

### Developing
Requirements:
* Docker
* npm

1. Clone this repo
1. Run `npm install` from `src/app/static`
1. Run `./scripts/run-dependencies.sh` to start a model API
1. Run `npm run build` from `src/app/static` to compile front-end dependencies.
1. Run app from your IDE or by `cd src && ./gradlew :app:bootRun` to serve the app on port 8080

For more information about developing the front-end see [src/app/static/README](src/app/static/README)
### Distribution
A docker image containing the app is created by running `./scripts/build-app.sh`. This is run as part of 
the Travis build. 
Run `docker run -p 8080:8080 mrcide/hint:branch_name` to run a built image.
