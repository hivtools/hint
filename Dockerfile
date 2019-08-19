FROM openjdk:8u121

RUN mkdir /static/public -p

COPY ./src/app/static/public /static/public
COPY ./src/app/templates /templates

ADD ./src/app/build/distributions/hint-boot.tar /
ENTRYPOINT ["/hint-boot/bin/hint"]
