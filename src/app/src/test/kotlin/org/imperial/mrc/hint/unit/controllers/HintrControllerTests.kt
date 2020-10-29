package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.AfterEach
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.mock.web.MockMultipartFile
import org.springframework.web.multipart.MultipartFile
import java.io.File

abstract class HintrControllerTests
{

    protected val tmpUploadDirectory = "tmp"
    protected val sessionId = "sid"
    protected val fakeUrl = "test-url"

    @AfterEach
    fun tearDown()
    {
        File(tmpUploadDirectory).deleteRecursively()
    }

    protected val mockFile = MockMultipartFile("data", "some-file-name.csv",
            "application/zip", "csv content".toByteArray())

    protected fun getMockFileManager(type: FileType): FileManager
    {
        return mock {
            on {
                saveFile(argWhere<MultipartFile> {
                    it.originalFilename == "some-file-name.csv"
                }, eq(type))
            } doReturn VersionFileWithPath("test-path", "hash", "some-file-name.csv", false)

            on {
                saveFile(any<String>(), eq(type))
            } doReturn VersionFileWithPath("test-path", "hash", "some-file-name.csv", false)

            on {
                getFile(FileType.Shape)
            } doReturn VersionFileWithPath("shape-path", "hash", "shape-file-name.csv", false)

            on {
                getFile(type)
            } doReturn VersionFileWithPath("test-path", "hash", "some-file-name.csv", false)
        }
    }

    protected fun getMockAPIClient(type: FileType): HintrAPIClient
    {
        return mock {
            on { validateBaselineIndividual(argWhere { it.path == "test-path" }, eq(type)) } doReturn ResponseEntity("VALIDATION_RESPONSE", HttpStatus.OK)
            on { validateSurveyAndProgramme(argWhere { it.path == "test-path" }, eq("shape-path"), eq(type)) } doReturn
                    ResponseEntity("VALIDATION_RESPONSE", HttpStatus.OK)
        }
    }

    abstract fun getSut(mockFileManager: FileManager, mockAPIClient: HintrAPIClient,
                        mockSession: Session, mockVersionRepository: VersionRepository): HintrController

    protected fun assertSavesAndValidates(fileType: FileType,
                                          uploadAction: (sut: HintrController) -> ResponseEntity<String>)
    {

        val mockFileManager = getMockFileManager(fileType)
        val mockApiClient = getMockAPIClient(fileType)
        val sut = getSut(mockFileManager, mockApiClient, mock(), mock())
        val result = uploadAction(sut)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.body).isEqualTo("VALIDATION_RESPONSE")
        verify(mockFileManager).saveFile(mockFile, fileType)

        when (fileType)
        {
            FileType.PJNZ, FileType.Population, FileType.Shape -> verify(mockApiClient)
                    .validateBaselineIndividual(
                            VersionFileWithPath("test-path", "hash", "some-file-name.csv", false), fileType)
            else -> verify(mockApiClient)
                    .validateSurveyAndProgramme(VersionFileWithPath("test-path", "hash", "some-file-name.csv", false),
                            "shape-path", fileType)
        }
    }

    protected fun assertSavesAndValidatesUrl(fileType: FileType,
                                             uploadAction: (sut: HintrController) -> ResponseEntity<String>)
    {

        val mockFileManager = getMockFileManager(fileType)
        val mockApiClient = getMockAPIClient(fileType)
        val sut = getSut(mockFileManager, mockApiClient, mock(), mock())
        val result = uploadAction(sut)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.body).isEqualTo("VALIDATION_RESPONSE")
        verify(mockFileManager).saveFile(fakeUrl, fileType)

        when (fileType)
        {
            FileType.PJNZ, FileType.Population, FileType.Shape -> verify(mockApiClient)
                    .validateBaselineIndividual(
                            VersionFileWithPath("test-path", "hash", "some-file-name.csv", false), fileType)
            else -> verify(mockApiClient)
                    .validateSurveyAndProgramme(VersionFileWithPath("test-path", "hash", "some-file-name.csv", false),
                            "shape-path", fileType)
        }
    }

    protected fun assertGetsIfExists(fileType: FileType,
                                     getAction: (sut: HintrController) -> ResponseEntity<String>)
    {

        val mockFileManager = getMockFileManager(fileType)
        val mockApiClient = getMockAPIClient(fileType)

        // should return the validation result when the file is returned from the file manager
        var sut = getSut(mockFileManager, mockApiClient, mock(), mock())
        var result = getAction(sut)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.body).isEqualTo("VALIDATION_RESPONSE")
        verify(mockApiClient)
                .validateBaselineIndividual(VersionFileWithPath("test-path", "hash", "some-file-name.csv", false),
                        fileType)

        // should return a null result when null is returned from the file manager
        sut = getSut(mock(), mockApiClient, mock(), mock())
        result = getAction(sut)

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val data = ObjectMapper().readTree(result.body)["data"].toString()
        assertThat(data).isEqualTo("null")
        verifyNoMoreInteractions(mockApiClient)
    }

    protected fun assertDeletes(fileType: FileType,
                                getAction: (sut: HintrController) -> ResponseEntity<String>)
    {
        val mockSession = mock<Session> {
            on { getVersionId() } doReturn "sid"
        }
        val mockSessionRepository = mock<VersionRepository>()
        val sut = getSut(mock(), mock(), mockSession, mockSessionRepository)
        val result = getAction(sut)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        verify(mockSessionRepository).removeVersionFile(sessionId, fileType)
    }
}
