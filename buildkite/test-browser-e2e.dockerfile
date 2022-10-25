ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

RUN npx playwright install
RUN npm install

CMD npm run browser-test --prefix=app/static
