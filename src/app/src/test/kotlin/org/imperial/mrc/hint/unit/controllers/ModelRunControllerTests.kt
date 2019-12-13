package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.ModelRunController
import org.imperial.mrc.hint.models.ModelRunOptions
import org.imperial.mrc.hint.models.SessionFileWithPath
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity

class ModelRunControllerTests {

    private val mockResponse = mock<ResponseEntity<String>>()
    private val modelRunOptions = ModelRunOptions(mapOf(), mapOf())

    @Test
    fun `can run`() {
        val mockHashes = mapOf<String, String>()
        val mockFileManager = mock<FileManager>{
            on {getAllHashes()} doReturn mockHashes
        }

        val mockAPIClient = mock<APIClient> {
            on {submit(mockHashes, modelRunOptions)} doReturn mockResponse
        }

        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.run(modelRunOptions)
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get status`() {
        val mockFileManager = mock<FileManager>()
        val mockAPIClient = mock<APIClient>{
            on {getStatus("testId")} doReturn mockResponse
        }

        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.status("testId")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get result`() {
        val mockFileManager = mock<FileManager>()
        val mockAPIClient = mock<APIClient> {
            on {getResult("testId")} doReturn mockResponse
        }
        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.result("testId")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get options`() {
        val mockFiles: Map<String, SessionFileWithPath> = mapOf()
        val mockFileManager = mock<FileManager> {
            on { getFiles(FileType.Shape, FileType.Survey, FileType.Programme, FileType.ANC) } doReturn mockFiles
        }

        val mockAPIClient = mock<APIClient>{
            on {getModelRunOptions(mockFiles)} doReturn mockResponse
        }
        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.options()
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can cancel`() {
        val mockFileManager = mock<FileManager>()
        val mockAPIClient = mock<APIClient>{
            on {cancelModelRun("testId")} doReturn mockResponse
        }
        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.cancel("testId")
        assertThat(result).isSameAs(mockResponse)
    }
}