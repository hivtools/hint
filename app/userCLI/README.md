## User CLI
For usage on first time deployment to bootstrap the app by adding some users 
to the database.

### Usage

    image=mrcide/hint-user-cli:latest
    docker run \
        -v hint_volume:/hint \
        $image <command>

or to test locally:
`./scripts/test-cli.sh <command>`

### Commands
#### Add user

    add-user test.user@example.com password
    
#### Remove user

    remove-user test.user@example.com

