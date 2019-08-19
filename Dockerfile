FROM openjdk:8u121

RUN mkdir /static/public -p

COPY ./src/app/static/public /static/public
COPY ./src/app/templates /templates

ADD ./src/app/build/distributions/app-boot.tar /
ENTRYPOINT ["/app-boot/bin/app"]
