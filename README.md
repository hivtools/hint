## HINT - HIV Indicators Tool
[SpringBoot](https://spring.io/projects/spring-boot) Kotlin web app for interfacing with a model API.

### Developing
Requirements:
* Docker
* npm

1. Clone this repo
1. Run `npm install` from `app/static`
1. Run `./scripts/run-dependencies.sh` to start a model API
1. Run `npm run build` from `app/static` to compile front-end dependencies.
1. Run app from your IDE or by `cd app && ./gradlew :bootRun` to serve the app on port 8080

### Distribution
A docker image containing the app is created by running `./scripts/build-app.sh`. This is run as part of 
the Travis build. 
Run `docker run -p 8080:8080 mrcide/hint:branch_name` to run a built image.

