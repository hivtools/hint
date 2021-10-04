ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

COPY ./src/app/static/scripts/test.properties /etc/hint/config.properties

# Test app
CMD ./gradlew :app:test --tests org.imperial.mrc.hint.integration.adr
