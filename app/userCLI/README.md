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

To build and push the `hint-user-cli` container, run `./scripts/build` and `./scripts/push` from the userCLI folder. 

### Commands
#### Add user

    add-user test.user@example.com password
    
#### Remove user

    remove-user test.user@example.com

