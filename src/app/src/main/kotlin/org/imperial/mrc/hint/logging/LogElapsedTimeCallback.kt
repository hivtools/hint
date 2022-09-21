package org.imperial.mrc.hint.logging

import java.time.Duration
import java.time.Instant

inline fun <T> logDurationOf(
    callback: () -> T,
    logger: GenericLogger,
): T
{
    val start = Instant.now()
    val response = callback()
    val end = Instant.now()
    val timeElapsed = Duration.between(start, end).toMillis()
    logger.info("ADR request time elapsed: $timeElapsed")
    return response
}
