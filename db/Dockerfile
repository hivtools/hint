FROM postgres:10.3
COPY bin /modelserver-db-bin
ENV PATH="modelserver-db-bin:$PATH"
ENV POSTGRES_DB modelserver-db
ENV POSTGRES_USER hint
ENV POSTGRES_PASSWORD changeme
# This is needed to override the loss of data that happens if you
# don't mount a persistent volume at the mount point.
ENV PGDATA /pgdata

COPY conf /etc/modelserver-db
RUN cat /etc/modelserver-db/postgresql.conf /etc/modelserver-db/postgresql.test.conf.in > \
        /etc/modelserver-db/postgresql.test.conf
RUN cat /etc/modelserver-db/postgresql.conf /etc/modelserver-db/postgresql.production.conf.in > \
        /etc/modelserver-db/postgresql.production.conf
RUN chown -R postgres:postgres /etc/modelserver-db
RUN ./docker-entrypoint.sh --version

RUN cp /modelserver-db-bin/create-users.sh /docker-entrypoint-initdb.d/

ENTRYPOINT ["/modelserver-db-bin/start-with-config.sh"]
CMD ["/etc/modelserver-db/postgresql.conf"]