ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

CMD npm run adr-integration-test-docker --prefix=app/static
