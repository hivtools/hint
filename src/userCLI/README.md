## User CLI
For usage on first time deployment to bootstrap the app by adding some users 
to the database.

### Usage

    image=mrcide/hint-user-cli:latest
    docker run \
        -v hint_volume:/hint \
        $image <command>

or to test locally, from root of hint repository:
1. `./scripts/run-development-dependencies.sh`
1. `./scripts/test-cli.sh <command>`

This will run the pushed container for the current commit. 

You can also run `/scripts/add-test-user.sh` after dependencies are running, to add a user `test.user@example.com` with
password `password` 

### Deployment
To build and push the `hint-user-cli` container, run `./buildkite/build-cli.sh` from the root of this repo.
This happens automatically during the BuildKite build.

### Commands
#### Add user

    add-user test.user@example.com password
    
#### Remove user

    remove-user test.user@example.com
    
#### Check if user exists
 
    user-exists test.user@example.com   

