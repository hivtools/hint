ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

CMD npx playwright install && npm run browser-test --prefix=app/static
