# Database migrations
We are using [Flyway](https://flywaydb.org/) for database migrations.

## Write a new migration
Add a new file to `sql`. This should be named following this scheme:

```
Vyear.month.day.hour.minute__Description.sql
```

These migrations can be applied by running the `modelserver_db_migrate` image. 

This image will be run by the 
`run-dependencies.sh` script after starting the database image `modelserver_db`.

The `modelserver_db_migrate` image can be built and pushed from the `/db/migrations` folder by
running `./scripts/build` and `./scripts/push`

This image expects the database to be running and accessible 
at:

* host: `modelserver-db`
* port: `5432`
* user: `naomi`
* password: `changeme`

You can override these by passing in command line options. Please see the Flyway
docs for more details.
