## HINT - HIV Indicators Tool
[![Front-end build](https://github.com/mrc-ide/hint/actions/workflows/test.yml/badge.svg)](https://github.com/mrc-ide/hint/actions/workflows/test.yml)
[![Back-end build](https://github.com/mrc-ide/hint/actions/workflows/testBack.yml/badge.svg)](https://github.com/mrc-ide/hint/actions/workflows/testBack.yml)
[![codecov](https://codecov.io/gh/mrc-ide/hint/branch/master/graph/badge.svg)](https://codecov.io/gh/mrc-ide/hint)

[SpringBoot](https://spring.io/projects/spring-boot) Kotlin web app for interfacing with the [Naomi model](https://github.com/mrc-ide/naomi) for joint small-area estimation of HIV prevalence, ART coverage, and HIV incidence via the [hintr package](https://github.com/mrc-ide/hintr).

### URL

[naomi.unaids.org](naomi.unaids.org)

### Developing
Requirements:
* Docker
* npm
* openjdk 11
  Mac users may find it easier to install adoptopenjdk-11k rather than openjdk-11:
wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | sudo apt-key add -
add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/
apt-get update
apt-get install adoptopenjdk-11-hotspot -y
* coreutils or [realpath](https://github.com/harto/realpath-osx) (Mac users only)


1. Clone this repo
1. Run `npm install` from `src/app/static`
1. Run `./scripts/run-development-dependencies.sh` to start docker instances of [hint-db](https://github.com/mrc-ide/hint-db/)
and [hintr](https://github.com/mrc-ide/hintr) and add a test user with username `test.user@example.com`
 and password `password`.
1. Run `npm run build` from `src/app/static` to compile front-end dependencies.
1. Run app from your IDE or by `./src/gradlew -p src :app:bootRun` to serve the app on port 8080

To run with hot reloading of the front end, after installing npm packages and running development dependencies.
1. Open a terminal at `src/app/static` and run `npm run serve`
1. In another terminal, from the root run `src/gradlew -PhotReload=true -p src app:bootRun`

For more information about developing the front-end see [src/app/static/README](https://github.com/mrc-ide/hint/blob/master/src/app/static/README.md)

For more information on Generic Chart, see [/docs/GenericChart.md](https://github.com/mrc-ide/hint/blob/mrc-2537/docs/GenericChart.md)

#### Run up app with Auth0 authentication

By default, when running up the app locally we use our own authentication system. On production we are using Auth0 to manage users and enable SSO with the ADR. Sometimes it can be useful to run up the local app using Auth0 authentication, so we can develop or test those slightly different UIs. To run locally with Auth0

1. Read the secrets from vault `vault read secret/hint/oauth2/development` if you want to use the production auth0 tenant with dev ADR.
2. Place these into the `config.properties` at `./src/app/src/main/resources/config.properties` in the following way
   1. `oauth2_client_id` to be the `id` value
   2. `oauth2_client_secret` to be the `secret` value
   3. `oauth2_client_url` to be the `url` value
   4. `oauth2_client_audience` to be the `audience` value
   5. `oauth2_client_adr_server_url` to be the `adr_server_url` value
3. Set the `oauth2_login_method` in `config.properties` to true
4. Ensure that you do not commit the secret to github

### Testing

Ensure dependencies are running and then execute tests on the command line or through IntelliJ
1. `./scripts/run-development-dependencies.sh`
1. `./src/gradlew -p src :app:test`

To run a specific test alone, add `--test` + the [fully qualified class name](https://docs.gradle.org/current/userguide/java_testing.html#full_qualified_name_pattern) to the command. For example, the command for running ProjectsControllerTests.kt would be: `./src/gradlew -p src :app:test --tests org.imperial.mrc.hint.unit.controllers.ProjectsControllerTests`

### Linting

```shell
./src/gradlew -p src :app:detektMain
```

### Database Interface

If the database schema has changed, you can regenerate the database interface code (in /src/databaseInterface)
by running `./src/gradlew -p src :generateDatabaseInterface:run` while the database container is running.

### Versioning
HINT Versions are recorded [here](NEWS.md). The latest version should match the value of currentHintVersion in
`src/app/static/src/app/hintVersion.ts`

If you make any change to the application which affects its functionality (i.e. anything other than a refactor, or
documentation or CI change, you should update the version by adding an entry to NEWS.md and setting currentHintVersion).

Versions should follow the [semantic versioning](https://semver.org/) format, so you should update the:
- MAJOR version when you make incompatible changes (e.g. a change to serialised version state format),
- MINOR version when you add functionality in a backwards compatible manner, and
- PATCH version when you make backwards compatible bug fixes.

This may cause relatively frequently conflicts since more than one person is likely to be working on a new version at a
time. In this case, you should give your branch its own new version number, rather than rolling your changes into the same
version number as changes from another branch.

### Distribution
A docker image containing the app is created as part of the BuildKite build. To create such an image locally,
run `./buildkite/make-build-env.sh` followed by `./buildkite/build.sh`. A CLI image is also created as part of
the BuildKite build, using `./buildkite/build-cli.sh`.

Run `docker run -p 8080:8080 --name hint mrcide/hint:branch_name` to run a built image. The app will not start until
config is provided at `/etc/hint/config.properties`. This config is added during deployment with
[hint-deploy](https://github.com/mrc-ide/hint-deploy)
