package org.imperial.mrc.hint.logging

import net.logstash.logback.argument.StructuredArguments.kv
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class GenericLoggerImpl(private val logger: Logger = LoggerFactory.getLogger(GenericLoggerImpl::class.java)): GenericLogger
{

    override fun info(log: LogMetadata)
    {
        logger.info("TEST INFO",
            kv("Username", log.username),
            kv("App", log.app),
            kv("Request", log.request),
            kv("Response", log.response),
            kv("Error", log.error),
            kv("Action", log.action),
            kv("Tags", log.tags)
        )
    }

    override fun error(log: LogMetadata)
    {
        logger.error("TEST ERROR",
            kv("Username", log.username),
            kv("App", log.app),
            kv("Request", log.request),
            kv("Response", log.response),
            kv("Error", log.error),
            kv("Action", log.action),
            kv("Tags", log.tags)
        )
    }
}