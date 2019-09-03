package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Java6Assertions
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.BaselineController
import org.imperial.mrc.hint.controllers.DiseaseController
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.mock.web.MockMultipartFile
import java.io.File

class BaselineControllerTests : HintrControllerTests() {

    @Test
    fun `can save pjnz file`() {

        val mockFileManager = getMockFileManager(FileType.PJNZ)
        val sut = BaselineController(mockFileManager, getMockAPIClient(FileType.PJNZ))

        sut.uploadPJNZ(mockFile)
        verify(mockFileManager).saveFile(mockFile, FileType.PJNZ)
    }

    @Test
    fun `returns pjnz file data if it exists`() {

        val file = File("$tmpUploadDirectory/fake-id/pjnz/Malawi_file_name.pjnz")

        file.mkdirs()
        file.createNewFile()

        val mockFileManager = mock<FileManager> {
            on { getFile(FileType.PJNZ) } doReturn file
        }

        val sut = BaselineController(mockFileManager, getMockAPIClient(FileType.PJNZ))
        val result = sut.get()
        val data = ObjectMapper().readTree(result)["data"]["pjnz"].toString()
        assertThat(data)
                .isEqualTo("{\"filename\":\"Malawi_file_name.pjnz\",\"data\":{\"country\":\"Malawi\"},\"type\":\"pjnz\"}")
    }

    @Test
    fun `returns null pjnz if no file exists`() {

        val mockFileManager = mock<FileManager> {
            on { getFile(FileType.PJNZ) } doReturn null as File?
        }
        val sut = BaselineController(mockFileManager, getMockAPIClient(FileType.PJNZ))
        val result = sut.get()
        val data = ObjectMapper().readTree(result)["data"].toString()
        assertThat(data)
                .isEqualTo("{\"pjnz\":null}")
    }

    @Test
    fun `validates shape file`() {

        val mockFileManager = getMockFileManager(FileType.Shape)
        val mockApiClient = getMockAPIClient(FileType.Shape)
        val sut = BaselineController(mockFileManager, mockApiClient)

        val result = sut.uploadShape(mockFile)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        verify(mockFileManager).saveFile(mockFile, FileType.Shape)
        verify(mockApiClient).validate("test-path", FileType.Shape)
    }
}
