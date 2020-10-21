## HINT - HIV Indicators Tool
[![Build Status](https://travis-ci.com/mrc-ide/hint.svg?branch=master)](https://travis-ci.com/mrc-ide/hint)
[![codecov](https://codecov.io/gh/mrc-ide/hint/branch/master/graph/badge.svg)](https://codecov.io/gh/mrc-ide/hint)

[SpringBoot](https://spring.io/projects/spring-boot) Kotlin web app for interfacing with the [Naomi model](https://github.com/mrc-ide/naomi-dev) for joint small-area estimation of HIV prevalence, ART coverage, and HIV incidence via the [hintr package](https://github.com/mrc-ide/hintr)

### Developing
Requirements:
* Docker
* npm
* openjdk 8
* coreutils (Mac users only)
* realpath


1. Clone this repo
1. Run `npm install` from `src/app/static`
1. Run `./scripts/run-development-dependencies.sh` to start docker instances of [hint-db](https://github.com/mrc-ide/hint-db/) 
and [hintr](https://github.com/mrc-ide/hintr) and add a test user with username `test.user@example.com`
 and password `password`.
1. Run `npm run build` from `src/app/static` to compile front-end dependencies.
1. Run app from your IDE or by `cd src && ./gradlew :app:bootRun` to serve the app on port 8080

For more information about developing the front-end see [src/app/static/README](https://github.com/mrc-ide/hint/blob/master/src/app/static/README.md)

### Testing

Ensure dependencies are running and then execute tests on the command line or through IntelliJ
1. `./scripts/run-development-dependencies.sh`
1. `./src/gradlew -p src app::test`

To run a specific test alone, add `--test` + the [fully qualified class name](https://docs.gradle.org/current/userguide/java_testing.html#full_qualified_name_pattern) to the command. For example, the command for running ProjectsControllerTests.kt would be: `./src/gradlew -p src app::test --tests org.imperial.mrc.hint.unit.controllers.ProjectsControllerTests`

### Database Interface

If the database schema has changed, you can regenerate the database interface code (in /src/databaseInterface)
by running `./src/gradlew -p src :generateDatabaseInterface:run` while the database container is running.

### Distribution
A docker image containing the app is created by running `./scripts/build-app.sh`. This is run as part of 
the Travis build. 
Run `docker run -p 8080:8080 mrcide/hint:branch_name` to run a built image.
