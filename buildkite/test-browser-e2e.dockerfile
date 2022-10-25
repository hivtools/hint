ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

RUN npm install @playwright/test
RUN npx playwright install
RUN npx playwright install-deps --dry-run

CMD npm run browser-test --prefix=app/static
