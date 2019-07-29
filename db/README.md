# modelserver db

You can build and push the db image by running the `./scripts/build` and `./scripts/push` from this folder. 

The db image will be started as part of the `run-dependencies.sh` script, which will also apply migrations. 