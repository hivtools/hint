package org.imperial.mrc.hint.logging

import com.fasterxml.jackson.databind.ObjectMapper

open class Logger<T>(val objectMapper: ObjectMapper = ObjectMapper()) : GenericLogger<T>
{
    fun info(logs: LogMetadata, msg: String? = null)
    {
        logger()
            .atInfo()
            .addKeyValue("metadata", objectMapper.writeValueAsString(logs))
            .log(msg)
    }

    fun error(logs: LogMetadata, msg: String? = null)
    {
        logger()
            .atError()
            .addKeyValue("app", objectMapper.writeValueAsString(logs))
            .log(msg)
    }
}
