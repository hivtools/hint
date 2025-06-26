#!/usr/bin/env bash

echo "Starting kotlin server"
nohup src/gradlew -p src app:bootrun > kotlin-logs.out 2>&1 &

sleep 20

for i in $(seq 1 25);
do
    echo "Waiting for kotlin server to come online..."
    if grep -Fq "Started AppStartKt in" kotlin-logs.out
    then
        echo "Kotlin server started!"
        exit 0
    else
        sleep 5
    fi
done

echo "Kotlin server did not start in time"
exit 1
