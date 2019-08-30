package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Java6Assertions.assertThat
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.DiseaseController
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.mock.web.MockMultipartFile
import java.io.File

class DiseaseControllerTests {

    private val tmpUploadDirectory = "tmp"

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    private val mockFile = MockMultipartFile("data", "some-file-name.csv",
            "application/zip", "csv content".toByteArray())

    private fun getMockFileManager(type: FileType): FileManager {
        return mock {
            on {
                saveFile(argWhere {
                    it.originalFilename == "some-file-name.csv"
                }, eq(type))
            } doReturn "test-path"
        }
    }

    private fun getMockAPIClient(type: FileType): APIClient {
        return mock {
            on { validate("test-path", type) } doReturn ResponseEntity("whatever", HttpStatus.OK)
        }
    }

    @Test
    fun `validates survey file`() {

        val mockFileManager = getMockFileManager(FileType.Survey)
        val mockApiClient = getMockAPIClient(FileType.Survey)
        val sut = DiseaseController(mockFileManager, mockApiClient)

        val result = sut.uploadSurvey(mockFile)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        verify(mockFileManager).saveFile(mockFile, FileType.Survey)
        verify(mockApiClient).validate("test-path", FileType.Survey)
    }

    @Test
    fun `validates program file`() {

        val mockFileManager = getMockFileManager(FileType.Program)
        val mockApiClient = getMockAPIClient(FileType.Program)
        val sut = DiseaseController(mockFileManager, mockApiClient)

        val result = sut.uploadProgram(mockFile)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        verify(mockFileManager).saveFile(mockFile, FileType.Program)
        verify(mockApiClient).validate("test-path", FileType.Program)
    }

    @Test
    fun `validates anc file`() {

        val mockFileManager = getMockFileManager(FileType.ANC)
        val mockApiClient = getMockAPIClient(FileType.ANC)
        val sut = DiseaseController(mockFileManager, mockApiClient)

        val result = sut.uploadANC(mockFile)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        verify(mockFileManager).saveFile(mockFile, FileType.ANC)
        verify(mockApiClient).validate("test-path", FileType.ANC)
    }
}
