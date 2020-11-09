ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

CMD npm run lint --prefix=app/static -- --quiet && \
    npm test --prefix=app/static && \
    codecov -f app/static/coverage/*.json && \
    codecov -f app/static/coverage/integration/*.json
