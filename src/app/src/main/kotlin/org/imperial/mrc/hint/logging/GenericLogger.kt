package org.imperial.mrc.hint.logging

interface GenericLogger
{
    fun info(log: LogMetadata)
    fun error(log: LogMetadata)
}