package org.imperial.mrc.hint.helpers

import org.assertj.core.api.AbstractAssert
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class TimeAssert(actual: String)
    : AbstractAssert<TimeAssert, String>(actual, TimeAssert::class.java)
{
    fun isSameTime(expectedTime: LocalDateTime): TimeAssert
    {
        assertThat(toDateTime(actual)).isCloseTo(expectedTime, within(1, ChronoUnit.MICROS))
        return this
    }

    private fun toDateTime(time: String): LocalDateTime
    {
        val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
        return LocalDateTime.parse(time, formatter)
    }

    companion object {
        fun assertThat(actual: String): TimeAssert {
            return TimeAssert(actual)
        }
    }
}
