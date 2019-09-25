package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.SessionFile
import org.imperial.mrc.hint.security.Session
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

    protected val mockFile = MockMultipartFile("data", "original.csv",
            "application/zip", "csv content".toByteArray())

    protected fun getMockFileManager(type: FileType): FileManager {
        return mock {
            on {
                saveFile(argWhere {
                    it.originalFilename == "original.csv"
                }, eq(type))
            } doReturn "test-path"

            on {
                getPath(argWhere { it.type == "shape" })
            } doReturn "shape-path"

            on {
                getPath(argWhere { it.type == type.toString() })
            } doReturn "test-path"
        }
    }

    protected fun getMockRepo(type: FileType): SessionRepository {
        return mock {
            on {
                getSessionFile("sid", type)
            } doReturn SessionFile("hash", "original.csv", type.toString())

            on {
                getSessionFile("sid", FileType.Shape)
            } doReturn SessionFile("hash", "original.csv", "shape")
        }
    }

    protected fun getMockAPIClient(type: FileType): APIClient {
        return mock {
            on { validateBaselineIndividual("original.csv", "test-path", type) } doReturn ResponseEntity("VALIDATION_RESPONSE", HttpStatus.OK)
            on { validateSurveyAndProgramme("original.csv", "test-path", "shape-path", type) } doReturn
                    ResponseEntity("VALIDATION_RESPONSE", HttpStatus.OK)
        }
    }

    abstract fun getSut(mockFileManager: FileManager,
                        mockSession: Session,
                        mockSessionRepository: SessionRepository,
                        mockAPIClient: APIClient): HintrController

    protected fun assertValidates(fileType: FileType,
                                  uploadAction: (sut: HintrController) -> ResponseEntity<String>) {

        val mockFileManager = getMockFileManager(fileType)
        val mockApiClient = getMockAPIClient(fileType)
        val mockSession = mock<Session> {
            on { getId() } doReturn "sid"
        }
        val mockRepo = getMockRepo(fileType)
        val sut = getSut(mockFileManager, mockSession, mockRepo, mockApiClient)
        val result = uploadAction(sut)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.body).isEqualTo("VALIDATION_RESPONSE")
        verify(mockFileManager).saveFile(mockFile, fileType)

        when (fileType) {
            FileType.PJNZ, FileType.Population, FileType.Shape ->
                verify(mockApiClient).validateBaselineIndividual("original.csv", "test-path", fileType)
            else -> verify(mockApiClient).validateSurveyAndProgramme("original.csv", "test-path", "shape-path", fileType)
        }
    }

    protected fun assertGetsIfExists(fileType: FileType,
                                     getAction: (sut: HintrController) -> ResponseEntity<String>) {

        val mockFileManager = getMockFileManager(fileType)
        val mockApiClient = getMockAPIClient(fileType)
        val mockSession = mock<Session> {
            on { getId() } doReturn "sid"
        }
        val mockRepo = getMockRepo(fileType)

        // should return the validation result when the file is returned from the file manager
        var sut = getSut(mockFileManager, mockSession, mockRepo, mockApiClient)
        var result = getAction(sut)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.body).isEqualTo("VALIDATION_RESPONSE")
        verify(mockApiClient).validateBaselineIndividual("original.csv", "test-path", fileType)

        // should return a null result when null is returned from the session repo
        sut = getSut(mockFileManager, mockSession, mock(), mockApiClient)
        result = getAction(sut)

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val data = ObjectMapper().readTree(result.body)["data"].toString()
        assertThat(data).isEqualTo("null")
        verifyNoMoreInteractions(mockApiClient)
    }
}
