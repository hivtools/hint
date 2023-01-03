ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

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

## Use the same version of playwright as is installed in package.json
## otherwise when tests run it will fail to locate chromium executable
RUN npm install @playwright/test@1.28.1
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

CMD npm run browser-test --prefix=app/static
