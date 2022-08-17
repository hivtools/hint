FROM openjdk:11

RUN mkdir /static/public -p

COPY ./app/static/public /static/public
COPY ./docker/entrypoint /entrypoint

ADD ./app/build/distributions/app-boot.tar /

ARG SPRING_PROFILES_ACTIVE
ENV SPRING_PROFILES_ACTIVE $SPRING_PROFILES_ACTIVE

ARG OAUTH2_CLIENT_SECRET
ENV OAUTH2_CLIENT_SECRET=$OAUTH2_CLIENT_SECRET

ARG OAUTH2_CLIENT_ID
ENV OAUTH2_CLIENT_ID=$OAUTH2_CLIENT_ID

ARG OAUTH2_CLIENT_URL
ENV OAUTH2_CLIENT_URL=$OAUTH2_CLIENT_URL

# This path is needed for the eventual configuration
RUN mkdir -p /etc/hint

ENTRYPOINT ["/entrypoint"]
