package org.imperial.mrc.hint.logging

import org.slf4j.Logger
import org.slf4j.LoggerFactory

interface GenericLogger<T>
{
    fun <T> T.logger(): Logger = LoggerFactory.getLogger(javaClass)
}