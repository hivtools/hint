package org.imperial.mrc.hint.unit.clients

import com.nhaarman.mockito_kotlin.*
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.clients.HintrWakeUpFilter
import org.junit.jupiter.api.Test
import javax.servlet.FilterChain
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

class HintrWakeUpFilterTest {

    @Test
    fun `wake up endpoint called`() {

        val mockResponse = mock<HttpServletResponse>()
        val mockChain = mock<FilterChain>()

        val mockAPIClient = mock<HintrAPIClient>()

        val mockProperties = mock<AppProperties> {
            on { hintrWakeUpInterval } doReturn 1
        }

        val sut = HintrWakeUpFilter(mockAPIClient, mockProperties)

        val mockRequest = mock<HttpServletRequest> {
            on { requestURI } doReturn "/test"
            on { method } doReturn "POST"
        }
        sut.doFilter(mockRequest, mockResponse, mockChain)

        // Assert that wake up called once
        verify(mockAPIClient, times(1)).wakeUpWorkers()

        // Calling again before interval
        sut.doFilter(mockRequest, mockResponse, mockChain)

        // Assert that wake up called once
        verify(mockAPIClient, times(1)).wakeUpWorkers()

        // Calling again after interval
        Thread.sleep(1000)
        sut.doFilter(mockRequest, mockResponse, mockChain)

        // Assert that wake up called twice
        verify(mockAPIClient, times(2)).wakeUpWorkers()

        // When we call a skipped path
        val mockRequest2 = mock<HttpServletRequest> {
            on { requestURI } doReturn "/robots.txt"
            on { method } doReturn "GET"
        }
        sut.doFilter(mockRequest2, mockResponse, mockChain)

        // Wake up has not been called
        verify(mockAPIClient, times(2)).wakeUpWorkers()
    }
}
