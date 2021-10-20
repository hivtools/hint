FROM vimc/node-docker-openjdk:mrc-2639

# Setup gradle
COPY ./src/gradlew /hint/src/
COPY ./src/gradle /hint/src/gradle/
WORKDIR /hint/src
RUN ./gradlew

# Pull in dependencies
COPY ./src/build.gradle /hint/src/
COPY ./src/settings.gradle /hint/src/
COPY ./src/config/ /hint/src/config/

RUN ./gradlew
RUN npm install codecov -g

# Install front-end dependencies
COPY ./src/app/static/package.json /hint/src/app/static/package.json
COPY ./src/app/static/package-lock.json /hint/src/app/static/package-lock.json
RUN npm ci --prefix=app/static

# Copy source
COPY . /hint
RUN ./gradlew :app:compileKotlin
