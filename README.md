## HINT - HIV Indicators Tool
[SpringBoot](https://spring.io/projects/spring-boot) Kotlin web app for interfacing with a model API.

### Developing
Requirements:
* Docker
* npm

1. Clone this repo
1. Run `npm install` from `src/app/static`
1. Run `./scripts/run-dependencies.sh` to start a model API
1. Run `npm run build` from `src/app/static` to compile front-end dependencies.
1. Run app from your IDE or by `cd src && ./gradlew :app:bootRun` to serve the app on port 8080
