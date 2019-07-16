## Model Server
[SpringBoot](https://spring.io/projects/spring-boot) Kotlin web app for interfacing with a model API.

### Developing
Requirements:
* Docker
* npm

1. Clone this repo
1. Run `npm install` from `app/static`
1. Run `./scripts/run-dependencies.sh` to start a model API
1. Run app from your IDE or by `./app/gradlew :bootRun` to serve the app on port 8080
