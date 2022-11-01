ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

RUN apt-get install -y \
    libnss3\
     libnspr4\
     libatk1.0-0\
     libatk-bridge2.0-0\
     libcups2\
     libdrm2 \
     libatspi2.0-0\
     libxcomposite1\
     libxdamage1\
     libxfixes3\
     libxrandr2\
     libgbm1\
     libxkbcommon0\
     libwayland-client0

RUN npm install @playwright/test
RUN npx playwright install
RUN npx playwright install-deps

#CMD npm run browser-test --prefix=app/static
