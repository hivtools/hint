package org.imperial.mrc.hint.helpers

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import java.util.*
import java.util.function.Predicate
import java.util.stream.Collectors

class LogMemoryAppender : ListAppender<ILoggingEvent?>() {
    fun reset() {
        this.list.clear()
    }

    fun contains(string: String, level: Level): Boolean {
        return this.list.stream()
            .anyMatch(Predicate { event: ILoggingEvent? ->
                event!!.toString().contains(string) && event.level == level
            })
    }

    fun countEventsForLogger(loggerName: String): Int {
        return this.list.stream()
            .filter(Predicate { event: ILoggingEvent? ->
                event!!.loggerName.contains(loggerName)
            })
            .count().toInt()
    }

    fun get(index: Int): ILoggingEvent? {
        return this.list[index]
    }
}
