package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.DownloadController
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

class DownloadControllerTests {
    @Test
    fun `downloads spectrum data`() {
        val mockResponse = mock<ResponseEntity<StreamingResponseBody>>()
        val mockAPIClient = mock<HintrAPIClient>{
            on {downloadSpectrum("id1")} doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSpectrum("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `downloads coarse output data`() {
        val mockResponse = mock<ResponseEntity<StreamingResponseBody>>()
        val mockAPIClient = mock<HintrAPIClient>{
            on {downloadCoarseOutput("id1")} doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getCoarseOutput("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }
}
