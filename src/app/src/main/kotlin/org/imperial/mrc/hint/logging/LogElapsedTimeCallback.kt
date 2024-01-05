package org.imperial.mrc.hint.logging

import org.slf4j.Logger
import java.time.Duration
import java.time.Instant

inline fun <T> logADRRequestDuration(
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

inline fun <T> logDuration(
    callback: () -> T,
    logger: GenericLogger,
    message: String,
    additionalData: MutableMap<String, String>? = null
): T
{
    val start = Instant.now()
    val response = callback()
    val end = Instant.now()
    val data = additionalData ?: mutableMapOf()
    data["timeInMillis"] = Duration.between(start, end).toMillis().toString()
    logger.info(message, data)
    return response
}
