ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

COPY ./src/app/static/scripts/test.properties /etc/hint/config.properties

ARG CODECOV_TOKEN
ENV CODECOV_TOKEN=$CODECOV_TOKEN

# Test app
CMD ./gradlew :app:detektMain -PexcludeADR=true :app:test :userCLI:test :app:jacocoTestReport && \
    codecov -p .. -f app/coverage/test/*.xml
