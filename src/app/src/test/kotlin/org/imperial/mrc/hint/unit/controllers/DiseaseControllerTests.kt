package org.imperial.mrc.hint.unit.controllers

import com.github.kittinunf.fuel.core.Response
import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Java6Assertions.assertThat
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.controllers.DiseaseController
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.mock.web.MockMultipartFile
import java.io.File
import java.net.URL

class DiseaseControllerTests {

    private val tmpUploadDirectory = "tmp"


    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `validates survey file`() {

        val mockFile = MockMultipartFile("data", "some-file-name.csv",
                "application/zip", "csv content".toByteArray())
        val mockFileManager = mock<FileManager> {
            on {
                saveFile(argWhere {
                    it.originalFilename == "some-file-name.csv"
                }, eq("survey"))
            } doReturn "test-path"
        }
        val mockApiClient = mock<APIClient>() {
            on { validate("test-path", "survey") } doReturn Response(URL("http://whatever"), 200)
        }
        val sut = DiseaseController(mockFileManager, mockApiClient)

        val result = sut.uploadSurvey(mockFile)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        verify(mockFileManager).saveFile(mockFile, "survey")
        verify(mockApiClient).validate("test-path", "survey")
    }

    @Test
    fun `validates program file`() {

        val mockFile = MockMultipartFile("data", "some-file-name.csv",
                "application/zip", "csv content".toByteArray())
        val mockFileManager = mock<FileManager> {
            on {
                saveFile(argWhere {
                    it.originalFilename == "some-file-name.csv"
                }, eq("program"))
            } doReturn "test-path"
        }
        val mockApiClient = mock<APIClient>() {
            on { validate("test-path", "program") } doReturn Response(URL("http://whatever"), 200)
        }
        val sut = DiseaseController(mockFileManager, mockApiClient)

        val result = sut.uploadProgram(mockFile)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        verify(mockFileManager).saveFile(mockFile, "program")
        verify(mockApiClient).validate("test-path", "program")
    }

}
