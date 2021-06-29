package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import jdk.nashorn.internal.ir.annotations.Ignore
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.DownloadController
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

class DownloadControllerTests
{
/*
    @Test
    fun `downloads spectrum data`()
    {
        val mockResponse = mock<ResponseEntity<StreamingResponseBody>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadSpectrum("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSpectrum("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `downloads coarse output data`()
    {
        val mockResponse = mock<ResponseEntity<StreamingResponseBody>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadCoarseOutput("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getCoarseOutput("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `downloads summary data`()
    {
        val mockResponse = mock<ResponseEntity<StreamingResponseBody>>()
        val mockApiClient = mock<HintrAPIClient>
        {
            on { downloadSummary("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockApiClient)
        val result = sut.getSummary("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }
 */

    @Test
    fun `get download submit data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getDownloadSubmit("id1","spectrum") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSubmit("spectrum", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get download submit status data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getDownloadSubmitStatus("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSubmitStatus("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get download submit result data`()
    {
        val mockResponse = mock<ResponseEntity<StreamingResponseBody>>()
        val mockApiClient = mock<HintrAPIClient>
        {
            on { getDownloadSubmitResult("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockApiClient)
        val result = sut.getSubmitResult("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }
}
