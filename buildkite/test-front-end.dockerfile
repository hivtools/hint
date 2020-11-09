ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

COPY ./src/app/static/scripts/test.properties /etc/hint/config.properties

ARG CODECOV_TOKEN
ENV CODECOV_TOKEN=$CODECOV_TOKEN

CMD npm run lint --prefix=app/static -- --quiet && \
    npm test --prefix=app/static && \
    npm run integration-test --prefix=app/static && \
    codecov -f app/static/coverage/*.json && \
    codecov -f app/static/coverage/integration/*.json
