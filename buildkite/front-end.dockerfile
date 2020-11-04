ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

ENV NODE_ENV=production

CMD npm run build --prefix=app/static && \
    npm run lint --prefix=app/static -- --quiet && \
    npm run test --prefix=app/static
   # TODO codecov -f app/static/coverage/*.json && \
   # TODO codecov -f app/static/coverage/integration/*.json
