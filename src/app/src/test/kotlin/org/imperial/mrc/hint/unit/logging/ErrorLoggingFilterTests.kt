package org.imperial.mrc.hint.unit.logging

import com.nhaarman.mockito_kotlin.*
import org.imperial.mrc.hint.logging.ErrorLoggingFilter
import org.junit.jupiter.api.Test
import org.slf4j.Logger
import org.springframework.web.util.ContentCachingResponseWrapper
import javax.servlet.FilterChain
import javax.servlet.ServletOutputStream
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

class ErrorLoggingFilterTests
{

    private val mockLogger = mock<Logger>()

    @Test
    fun `logs expected messages on error status`()
    {

        val mockRequest = mock<HttpServletRequest> {
            on { servletPath } doReturn "/test"
        }

        val mockOutputStream = mock<ServletOutputStream>()

        val mockResponse = mock<HttpServletResponse> {
            on { status } doReturn 500
            on { characterEncoding } doReturn "UTF-8"
            on { outputStream } doReturn mockOutputStream
        }

        //mock going through the filter chain, writing a response to the wrapper
        val mockChain = mock<FilterChain> {
            on { doFilter(any(), any()) } doAnswer ({
                val args = it.arguments
                val response = args[1] as ContentCachingResponseWrapper
                response.writer.write("TEST BODY")
            })
        }

        val sut = ErrorLoggingFilter(mockLogger)
        sut.doFilter(mockRequest, mockResponse, mockChain)

        //Assert expected messages logged
        verify(mockLogger).error("ERROR: 500 response for /test")
        verify(mockLogger).error("TEST BODY")
        verifyNoMoreInteractions(mockLogger)

        //Assert that write was called on our wrapped output stream (this happens as part of
        //ContentCachingResponseWrapper.copyBodyToResponse)
        verify(mockOutputStream).write(any(), eq(0), eq(9)) //expected length of test body
    }

    @Test
    fun `logs no messages on success status`()
    {
        val mockRequest = mock<HttpServletRequest> {
            on { servletPath } doReturn "/test"
        }

        val mockResponse = mock<HttpServletResponse> {
            on { status } doReturn 200
            on { outputStream } doReturn mock<ServletOutputStream>()
        }

        val sut = ErrorLoggingFilter(mockLogger)
        sut.doFilter(mockRequest, mockResponse, mock())

        verifyZeroInteractions(mockLogger)
    }

    @Test
    fun `logs expected message on error status for download endpoint`()
    {

        val mockRequest = mock<HttpServletRequest> {
            on { servletPath } doReturn "/download/test"
        }

        val mockResponse = mock<HttpServletResponse> {
            on { status } doReturn 500
        }

        val mockChain = mock<FilterChain>()

        val sut = ErrorLoggingFilter(mockLogger)
        sut.doFilter(mockRequest, mockResponse, mockChain)

        verify(mockLogger).error("ERROR: 500 response for /download/test")
        verifyNoMoreInteractions(mockLogger)

        //verify doFilter was called with unwrapped response
        verify(mockChain).doFilter(mockRequest, mockResponse)

    }
}