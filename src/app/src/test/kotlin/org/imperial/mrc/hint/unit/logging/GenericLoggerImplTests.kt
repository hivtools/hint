package org.imperial.mrc.hint.unit.logging

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.LoggerContext
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import net.logstash.logback.argument.StructuredArguments.kv
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.helpers.LogMemoryAppender
import org.imperial.mrc.hint.logging.*
import org.imperial.mrc.hint.models.ErrorDetail
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpSession

class GenericLoggerImplTests
{

    companion object {

        lateinit var testLogger: org.slf4j.Logger
        lateinit var memoryAppender: LogMemoryAppender

        @BeforeAll
        @JvmStatic
        fun setup() {
            testLogger = LoggerFactory.getLogger(GenericLoggerImpl::class.java) as Logger
            memoryAppender = LogMemoryAppender()
            memoryAppender.context = LoggerFactory.getILoggerFactory() as LoggerContext
            (testLogger as Logger).level = Level.DEBUG
            (testLogger as Logger).addAppender(memoryAppender)
            memoryAppender.start()
        }
    }

    @BeforeEach
    fun resetAppender()
    {
        memoryAppender.reset()
    }

    private val mockLogger = mock<org.slf4j.Logger>()

    val mockSession = mock<HttpSession> {
        on { id } doReturn "session1"
    }

    private val mockRequest = mock<HttpServletRequest>{
        on { method } doReturn "POST"
        on { servletPath } doReturn "/project"
        on { serverName } doReturn "hint"
        on { getHeader("User-Agent")} doReturn "Safari"
        on { remoteAddr } doReturn "127.0.0.1"
        on { session } doReturn mockSession
    }

    private val requestData = Request(
        "POST",
        "/project",
        "hint",
        Client("Safari", "127.0.0.1", "session1")
    )

    private val appOrigin = AppOrigin("hint", "http://localhost:8080","backend")

    private val mockResponse = mock<HttpServletResponse>{
        on { status } doReturn 500
    }

    @Test
    fun `can log info with action text`()
    {
        val loggedData = LogMetadata(
            "updated project notes",
            null,
            null,
            null,
            null,
            appOrigin,
            emptyList()
        )

        val sut = GenericLoggerImpl(mockLogger)
        sut.info("updated project notes")
        verify(mockLogger).info("{}", kv("hint", loggedData))
    }

    @Test
    fun `can log info with action text, HttpRequest and username`()
    {
        val loggedData = LogMetadata(
            "updated project notes",
            null,
            requestData,
            null,
            "testUser",
            appOrigin,
            emptyList()
        )
        val sut = GenericLoggerImpl(mockLogger)
        sut.info("updated project notes", mockRequest, "testUser")
        verify(mockLogger).info("{}", kv("hint", loggedData))
    }

    @Test
    fun `can log info with action text and HttpRequest`()
    {
        val loggedData = LogMetadata(
            "updated project notes",
            null,
            requestData,
            null,
            null,
            appOrigin,
            emptyList()
        )
        val sut = GenericLoggerImpl(mockLogger)
        sut.info("updated project notes", mockRequest)
        verify(mockLogger).info("{}", kv("hint", loggedData))
    }

    @Test
    fun `can log info with generic additional data`()
    {
        val additionalData = mapOf(
            "foo" to "bar",
            "thing" to 423
        )
        val logger = GenericLoggerImpl(testLogger)
        logger.info("My info message", additionalData)
        Assertions.assertThat(memoryAppender.countEventsForLogger("org.imperial.mrc.hint.logging.GenericLoggerImpl")).isEqualTo(1)
        Assertions.assertThat(memoryAppender.get(0).toString()).isEqualTo("[INFO] msg=My info message, {foo=bar, thing=423}")
    }

    @Test
    fun `can log error with generic additional data`()
    {
        val additionalData = mapOf(
            "foo" to "bar",
            "thing" to 423
        )
        val logger = GenericLoggerImpl(testLogger)
        logger.error("My err message", additionalData)
        Assertions.assertThat(memoryAppender.countEventsForLogger("org.imperial.mrc.hint.logging.GenericLoggerImpl")).isEqualTo(1)
        Assertions.assertThat(memoryAppender.get(0).toString()).isEqualTo("[ERROR] msg=My err message, {foo=bar, thing=423}")
    }

    @Test
    fun `can log error with HttpRequest, HttpResponse and message`()
    {
        val loggedData = LogMetadata(
            null,
            ErrorMessage(
                null,
                ErrorDetail(
                    HttpStatus.valueOf(500),
                    "error message",
                    "OTHER_ERROR"
                )
            ),
            requestData,
            null,
            null,
            appOrigin,
            emptyList()
        )
        val sut = GenericLoggerImpl(mockLogger)
        sut.error(mockRequest, mockResponse, "error message")
        verify(mockLogger).error("{}", kv("hint", loggedData))
    }
    @Test
    fun `can log error with HttpRequest, HttpResponse`()
    {
        val loggedData = LogMetadata(
            null,
            ErrorMessage(
                null,
                ErrorDetail(
                    HttpStatus.valueOf(500),
                    "",
                    "OTHER_ERROR"
                )
            ),
            requestData,
            null,
            null,
            appOrigin,
            emptyList()
        )
        val sut = GenericLoggerImpl(mockLogger)
        sut.error(mockRequest, mockResponse)
        verify(mockLogger).error("{}", kv("hint", loggedData))
    }

    @Test
    fun `can log error with HttpRequest, Throwable and HttpStatus`()
    {
        val error = Exception("test error message")
        val loggedData = LogMetadata(
            null,
            ErrorMessage(
                error,
                ErrorDetail(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "test error message",
                    "OTHER_ERROR"
                )
            ),
            requestData,
            null,
            null,
            appOrigin,
            emptyList()
        )
        val sut = GenericLoggerImpl(mockLogger)
        sut.error(mockRequest, error, HttpStatus.INTERNAL_SERVER_ERROR)
        verify(mockLogger).error("{}", kv("hint", loggedData))
    }
    @Test
    fun `can log error with HttpRequest, and HintException`()
    {
        val error = HintException("badKey")
        val loggedData = LogMetadata(
            null,
            ErrorMessage(
                error.cause,
                ErrorDetail(
                    error.httpStatus,
                    error.message.toString(),
                    "OTHER_ERROR"
                ),
                error.key
            ),
            requestData,
            null,
            null,
            appOrigin,
            emptyList()
        )
        val sut = GenericLoggerImpl(mockLogger)
        sut.error(mockRequest, error)
        verify(mockLogger).error("{}", kv("hint", loggedData))
    }
}
