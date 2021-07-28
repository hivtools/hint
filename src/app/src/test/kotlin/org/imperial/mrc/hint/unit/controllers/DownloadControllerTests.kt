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
    fun `submit spectrum download`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadOutputSubmit("spectrum", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getDownloadOutput("spectrum", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `submit summary download`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadOutputSubmit("summary", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getDownloadOutput("summary", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `submit coarse-output download`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadOutputSubmit("coarse-output", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getDownloadOutput("coarse-output", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get download status`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadOutputStatus("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getDownloadOutputStatus("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get download result`()
    {
        val mockResponse = mock<ResponseEntity<StreamingResponseBody>>()
        val mockApiClient = mock<HintrAPIClient>
        {
            on { downloadOutputResult("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockApiClient)
        val result = sut.getDownloadOutputResult("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }
}
