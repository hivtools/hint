package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.models.SessionFileWithPath
import org.junit.jupiter.api.AfterEach
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.mock.web.MockMultipartFile
import java.io.File

abstract class HintrControllerTests {

    protected val tmpUploadDirectory = "tmp"

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    protected val mockFile = MockMultipartFile("data", "some-file-name.csv",
            "application/zip", "csv content".toByteArray())

    protected fun getMockFileManager(type: FileType): FileManager {
        return mock {
            on {
                saveFile(argWhere {
                    it.originalFilename == "some-file-name.csv"
                }, eq(type))
            } doReturn SessionFileWithPath("test-path", "hash", "some-file-name.csv")

            on {
                getFile(FileType.Shape)
            } doReturn SessionFileWithPath("shape-path", "hash", "shape-file-name.csv")

            on {
                getFile(type)
            } doReturn SessionFileWithPath("test-path", "hash", "some-file-name.csv")
        }
    }

    protected fun getMockAPIClient(type: FileType): APIClient {
        return mock {
            on { validateBaselineIndividual(argWhere { it.path == "test-path" }, eq(type)) } doReturn ResponseEntity("VALIDATION_RESPONSE", HttpStatus.OK)
            on { validateSurveyAndProgramme(argWhere { it.path == "test-path" }, eq("shape-path"), eq(type)) } doReturn
                    ResponseEntity("VALIDATION_RESPONSE", HttpStatus.OK)
        }
    }

    abstract fun getSut(mockFileManager: FileManager, mockAPIClient: APIClient): HintrController

    protected fun assertValidates(fileType: FileType,
                                  uploadAction: (sut: HintrController) -> ResponseEntity<String>) {

        val mockFileManager = getMockFileManager(fileType)
        val mockApiClient = getMockAPIClient(fileType)
        val sut = getSut(mockFileManager, mockApiClient)
        val result = uploadAction(sut)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.body).isEqualTo("VALIDATION_RESPONSE")
        verify(mockFileManager).saveFile(mockFile, fileType)

        when (fileType) {
            FileType.PJNZ, FileType.Population, FileType.Shape -> verify(mockApiClient)
                    .validateBaselineIndividual(
                            SessionFileWithPath("test-path", "hash", "some-file-name.csv"), fileType)
            else -> verify(mockApiClient)
                    .validateSurveyAndProgramme(SessionFileWithPath("test-path", "hash", "some-file-name.csv"), "shape-path", fileType)
        }
    }

    protected fun assertGetsIfExists(fileType: FileType,
                                     getAction: (sut: HintrController) -> ResponseEntity<String>) {

        val mockFileManager = getMockFileManager(fileType)
        val mockApiClient = getMockAPIClient(fileType)

        // should return the validation result when the file is returned from the file manager
        var sut = getSut(mockFileManager, mockApiClient)
        var result = getAction(sut)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.body).isEqualTo("VALIDATION_RESPONSE")
        verify(mockApiClient)
                .validateBaselineIndividual(SessionFileWithPath("test-path", "hash", "some-file-name.csv"), fileType)

        // should return a null result when null is returned from the file manager
        sut = getSut(mock(), mockApiClient)
        result = getAction(sut)

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val data = ObjectMapper().readTree(result.body)["data"].toString()
        assertThat(data).isEqualTo("null")
        verifyNoMoreInteractions(mockApiClient)
    }
}
