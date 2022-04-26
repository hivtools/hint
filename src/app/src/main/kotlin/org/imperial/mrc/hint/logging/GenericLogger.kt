package org.imperial.mrc.hint.logging

interface GenericLogger
{
    fun info(log: LogMetadata, msg: String)
    fun error(log: LogMetadata, msg: String)
}