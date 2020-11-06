ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

ARG GIT_ID

COPY ./src/app/static/scripts/test.properties /etc/hint/config.properties

ENV GIT_ID=$GIT_ID

CMD ./gradlew :userCLI:test && \
    rm /etc/hint/config.properties && \
    ./gradlew :userCLI:distDocker -i -Pdocker_version=$GIT_ID
