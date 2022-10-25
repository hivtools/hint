ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

RUN apt-get ttf-ubuntu-font-family &&\
    libenchant-2-2 && \
    libicu66 && \
    libjpeg-turbo8 && \
    libvpx6 && \
    libevent-2.1-7

RUN npm install @playwright/test
RUN npx playwright install
RUN npx playwright install-deps --dry-run

CMD npm run browser-test --prefix=app/static
