package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.DebugController
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import javax.servlet.http.HttpServletResponse

class DebugControllerTests {

    @Test
    fun `can get debug download from hintr`()
    {
        val mockResponse = mock<HttpServletResponse>()
        val mockAPIClient = mock<HintrAPIClient>()
        val mockSession = mock<Session>()

        val sut = DebugController(mockAPIClient, mockSession)
        sut.downloadDebug("id1", mockResponse)
        verify(mockAPIClient).downloadDebug("id1", mockResponse)
    }

}
