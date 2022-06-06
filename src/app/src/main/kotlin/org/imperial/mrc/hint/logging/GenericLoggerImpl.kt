package org.imperial.mrc.hint.logging

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class GenericLoggerImpl(
        private val logger: Logger = LoggerFactory.getLogger(GenericLoggerImpl::class.java)
) : GenericLogger
{

    override fun info(log: LogMetadata)
    {
        val objectMapper = ObjectMapper()
        logger.info(objectMapper.writeValueAsString(mapOf("hint" to log)))
    }
}
