package org.imperial.mrc.hint.logging

import org.slf4j.Logger
import org.slf4j.LoggerFactory

interface GenericLogger
{
    fun info(log: LogMetadata)
    fun error(log: LogMetadata)
}