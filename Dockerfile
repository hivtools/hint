FROM eclipse-temurin:18

RUN mkdir /static/public -p

COPY ./app/static/public /static/public
COPY ./docker/entrypoint /entrypoint
COPY ./docker/entrypoint_azure /entrypoint_azure
COPY ./docker/config.properties /config.properties

ADD ./app/build/distributions/app-boot.tar /

ARG SPRING_PROFILES_ACTIVE
ENV SPRING_PROFILES_ACTIVE $SPRING_PROFILES_ACTIVE

# This path is needed for the eventual configuration
RUN mkdir -p /etc/hint

# Install jq to parse secrets from Avenir Auth server
RUN microdnf install jq

ENTRYPOINT ["/entrypoint"]
