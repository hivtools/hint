package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.controllers.DownloadController
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity

class DownloadControllerTests {
    @Test
    fun `downloads spectrum data`() {
        val mockResponse = mock<ResponseEntity<ByteArray>>()
        val mockAPIClient = mock<APIClient>{
            on {downloadSpectrum("id1")} doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSpectrum("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `downloads summary data`() {
        val mockResponse = mock<ResponseEntity<ByteArray>>()
        val mockAPIClient = mock<APIClient>{
            on {downloadSummary("id1")} doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSummary("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }
}