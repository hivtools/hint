FROM mrcide/node-20-docker:main

RUN npm install codecov -g

# Install front-end dependencies
COPY ./src/app/static/package.json /hint/src/app/static/package.json
COPY ./src/app/static/package-lock.json /hint/src/app/static/package-lock.json
RUN npm ci --cache .npm --prefer-offline --prefix=app/static

# Copy source
COPY . /hint
RUN ./gradlew :app:compileKotlin
