package org.imperial.mrc.hint.logging

import net.logstash.logback.argument.StructuredArguments.kv
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class GenericLoggerImpl(
        private val logger: Logger = LoggerFactory.getLogger(GenericLoggerImpl::class.java)
) : GenericLogger
{

    override fun info(log: LogMetadata, msg: String?)
    {
        logger.info(msg, kv("hint", log))
    }
}
