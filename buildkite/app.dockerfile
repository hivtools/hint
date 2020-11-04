ARG GIT_ID="UNKNOWN"
FROM mrcide/hint-shared-build-env:$GIT_ID

ARG SPRING_PROFILE
ARG TAG

RUN ./gradlew :app:bootDistTar

ENV SPRING_PROFILE=$SPRING_PROFILE
ENV TAG=$TAG

CMD docker build --build-arg SPRING_PROFILES_ACTIVE=$SPRING_PROFILE -f /hint/Dockerfile --tag $TAG . \
    && ./gradlew :userCLI:distDocker -i -Pdocker_version=$GIT_ID
