package org.imperial.mrc.hint.logging

import com.fasterxml.jackson.databind.ObjectMapper
import net.logstash.logback.argument.StructuredArguments
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class GenericLoggerImpl(private val logger: Logger = LoggerFactory.getLogger(GenericLoggerImpl::class.java)): GenericLogger
{
    private val objectMapper: ObjectMapper = ObjectMapper()

    override fun info(log: LogMetadata)
    {
        logger.info("$log",
            StructuredArguments.kv("Username", log.username),
            StructuredArguments.kv("App", log.app),
            StructuredArguments.kv("Request", log.request),
            StructuredArguments.kv("Response", log.response),
            StructuredArguments.kv("Error", log.error),
            StructuredArguments.kv("Action", log.action),
            StructuredArguments.kv("Tags", log.tags)
        )
    }

    override fun error(log: LogMetadata)
    {
        logger.error(objectMapper.writeValueAsString(log),
            StructuredArguments.kv("Username", log.username),
            StructuredArguments.kv("App", log.app),
            StructuredArguments.kv("Request", log.request),
            StructuredArguments.kv("Response", log.response),
            StructuredArguments.kv("Error", log.error),
            StructuredArguments.kv("Action", log.action),
            StructuredArguments.kv("Tags", log.tags)
        )
    }
}