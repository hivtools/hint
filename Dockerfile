FROM openjdk:8u121

RUN mkdir /static/public -p

COPY ./app/static/public /static/public
COPY ./app/templates /templates

ADD ./app/build/distributions/hint-boot.tar /
ENTRYPOINT ["/hint-boot/bin/hint"]
