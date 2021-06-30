package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.DownloadController
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

class DownloadControllerTests
{
    @Test
    fun `get download spectrum data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getDownloadSubmit("spectrum", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSubmit("spectrum", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `get download summary data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getDownloadSubmit("summary", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSubmit("summary", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `get download coarse-output data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getDownloadSubmit("coarse-output", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getSubmit("coarse-output", "id1")
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
