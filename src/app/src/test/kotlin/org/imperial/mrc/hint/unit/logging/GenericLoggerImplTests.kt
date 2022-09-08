package org.imperial.mrc.hint.unit.logging

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import net.logstash.logback.argument.StructuredArguments.kv
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.logging.*
import org.imperial.mrc.hint.models.ErrorDetail
import org.junit.jupiter.api.Test
import org.slf4j.Logger
import org.springframework.http.HttpStatus
import java.lang.Exception
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpSession

class GenericLoggerImplTests
{
    private val mockLogger = mock<Logger>()

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

    private val appOrigin = AppOrigin("hint", "backend")

    private val mockResponse = mock<HttpServletResponse>{
        on { status } doReturn 500
    }

    @Test
    fun `can log info action performed in key value format`()
    {
        val log = LogMetadata(
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
        verify(mockLogger).info("{}", kv("hint", log))
    }

    @Test
    fun `can log info with HttpRequest and username performed key value format`()
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
    fun `can log error with HttpRequest, HttpResponse and message`()
    {
        val mockLogger = mock<Logger>()

        val loggedData = LogMetadata(
            null,
            ErrorMessage(
                null,
                ErrorDetail(
                    HttpStatus.valueOf(500),
                    "error message",
                    "OTHER_ERROR",
                    null
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
                    "OTHER_ERROR",
                    listOf("test error message")
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
                    "OTHER_ERROR",
                    listOf(error.message.toString())
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
