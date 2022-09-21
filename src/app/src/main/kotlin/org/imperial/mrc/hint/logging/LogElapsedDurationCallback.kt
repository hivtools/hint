package org.imperial.mrc.hint.logging

import org.springframework.http.ResponseEntity
import java.io.BufferedInputStream
import java.time.Duration
import java.time.Instant

fun logDurationOfResponseEntityRequests(
    callback: () -> ResponseEntity<String>,
    logger: GenericLogger,
): ResponseEntity<String>
{
    val start = Instant.now()
    val response = callback()
    val end = Instant.now()
    val timeElapsed = Duration.between(start, end).toMillis()
    logger.info("ADR request time elapsed: $timeElapsed")
    return response
}

fun logDurationOfStreamRequests(
    callback: () -> BufferedInputStream,
    logger: GenericLogger,
): BufferedInputStream
{
    val start = Instant.now()
    val response = callback()
    val end = Instant.now()
    val timeElapsed = Duration.between(start, end).toMillis()
    logger.info("ADR request time elapsed: $timeElapsed")
    return response
}