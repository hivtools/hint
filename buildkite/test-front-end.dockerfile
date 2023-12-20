ARG GIT_ID="UNKNOWN"
FROM mrcide/node-20-docker:$GIT_ID

ARG CODECOV_TOKEN
ENV CODECOV_TOKEN=$CODECOV_TOKEN

CMD npm test --prefix=app/static && \
    npm run integration-test-docker --prefix=app/static && \
    npm run lint --prefix=app/static -- --quiet && \
    codecov -p .. -f app/static/coverage/*.json && \
    codecov -p .. -f app/static/coverage/integration/*.json
