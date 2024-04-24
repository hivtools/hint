package org.imperial.mrc.hint.unit.logging

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.LoggerContext
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.clients.FuelClient
import org.imperial.mrc.hint.helpers.LogMemoryAppender
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.logging.logADRRequestDuration
import org.imperial.mrc.hint.logging.logDuration
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyString
import org.mockito.ArgumentMatchers.contains
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.net.URI
import java.net.http.HttpResponse

class LogElapsedTimeCallbackTests
{
    private val mockLogger = mock<GenericLogger>()

    companion object {

        lateinit var testLogger: org.slf4j.Logger
        lateinit var memoryAppender: LogMemoryAppender

        @BeforeAll
        @JvmStatic
        fun setup() {
            testLogger = LoggerFactory.getLogger(GenericLoggerImpl::class.java) as Logger
            memoryAppender = LogMemoryAppender()
            memoryAppender.context = LoggerFactory.getILoggerFactory() as LoggerContext
            (testLogger as Logger).setLevel(Level.DEBUG)
            (testLogger as Logger).addAppender(memoryAppender)
            memoryAppender.start()
        }
    }

    @BeforeEach
    fun resetAppender()
    {
        memoryAppender.reset()
    }

    @Test
    fun `callback request can write log and return responseEntity`()
    {
        val mockResponse = ResponseEntity.ok().body("test")
        val mockFuelClient = mock<FuelClient> {
            on { get(anyString()) } doReturn mockResponse
        }
        val result = logADRRequestDuration({ mockFuelClient.get("url") }, mockLogger)
        assertEquals(result.statusCode, HttpStatus.OK)
        assertEquals(result.body, "test")
        verify(mockLogger).info(contains("ADR request time elapsed: "))
    }

    @Test
    fun `callback request can return HttpResponse`()
    {
        val anyInputStream = ByteArrayInputStream("test data".toByteArray())

        val mockHttpResponse = mock<HttpResponse<InputStream>> {
            on { body() } doReturn anyInputStream
            on { statusCode() } doReturn 200
            on { uri() } doReturn URI("http://test.url")
        }

        val mockADRClient = mock<ADRClient> {
            on { getInputStream(anyString()) } doReturn mockHttpResponse
        }

        val result = logADRRequestDuration({ mockADRClient.getInputStream("url") }, mockLogger)

        assertEquals(result.statusCode(), 200)

        assertEquals(result.uri(), URI("http://test.url"))

        assertEquals(result.body().bufferedReader().use { it.readText() }, "test data")

        verify(mockLogger).info(contains("ADR request time elapsed: "))
    }

    @Test
    fun `can log duration with arbitrary data`()
    {
        val additionalData = mutableMapOf(
            "foo" to "bar",
            "thing" to "423"
        )
        val doThing = {
            Thread.sleep(500)
            2
        }
        val logger = GenericLoggerImpl(testLogger)

        val result = logDuration({ doThing() }, logger, "Ran x", additionalData)
        Assertions.assertThat(result).isEqualTo(2)
        Assertions.assertThat(memoryAppender.countEventsForLogger("org.imperial.mrc.hint.logging.GenericLoggerImpl")).isEqualTo(1)
        Assertions.assertThat(memoryAppender.get(0).toString()).isEqualTo("[INFO] msg=Ran x, {foo=bar, thing=423, timeInMillis=500}")

        val result2 = logDuration({ doThing() }, logger, "Ran x")
        Assertions.assertThat(result2).isEqualTo(2)
        Assertions.assertThat(memoryAppender.countEventsForLogger("org.imperial.mrc.hint.logging.GenericLoggerImpl")).isEqualTo(2)
        Assertions.assertThat(memoryAppender.get(1).toString()).isEqualTo("[INFO] msg=Ran x, {timeInMillis=500}")
    }
}
