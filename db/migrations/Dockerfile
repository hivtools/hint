FROM boxfuse/flyway:5.2.4

COPY sql /flyway/sql/
COPY flyway.conf /flyway/conf/flyway.conf

ENTRYPOINT ["flyway", "migrate"]