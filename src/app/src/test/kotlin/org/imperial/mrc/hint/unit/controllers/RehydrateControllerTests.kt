package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.RehydrateController
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MultipartFile

class RehydrateControllerTests
{
    @Test
    fun `submit output zip file`()
    {
        val payload = VersionFileWithPath("testdata/output.zip", "1", "output", false)
        val mockResponse = mock<ResponseEntity<String>>()
        val multipartFile = mock<MultipartFile>()

        val mockFileManager = mock<FileManager> {
            on {saveOutput(multipartFile)} doReturn payload
        }

        val mockAPIClient = mock<HintrAPIClient> {
            on { submitRehydrate(payload) } doReturn mockResponse
        }

        val sut = RehydrateController(mockAPIClient, mockFileManager)
        val result = sut.submitRehydrate(multipartFile)
        verify(mockAPIClient).submitRehydrate(payload)
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `get rehydrate status`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockFileManager = mock<FileManager>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { rehydrateStatus("id") } doReturn mockResponse
        }

        val sut = RehydrateController(mockAPIClient, mockFileManager)
        val result = sut.getRehydrateStatus("id")
        verify(mockAPIClient).rehydrateStatus("id")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `get rehydrate result`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockFileManager = mock<FileManager>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { rehydrateResult("id") } doReturn mockResponse
        }

        val sut = RehydrateController(mockAPIClient, mockFileManager)
        val result = sut.getRehydrateResult("id")
        verify(mockAPIClient).rehydrateResult("id")
        assertThat(result).isSameAs(mockResponse)
    }
}