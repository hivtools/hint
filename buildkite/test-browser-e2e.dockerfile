ARG GIT_ID="UNKNOWN"
ARG NODE_VERSION=16
FROM mrcide/hint-shared-build-env:$GIT_ID

RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y && \
    curl -sL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash - && \
    apt-get install -y nodejs

CMD npm run browser-test --prefix=app/static
