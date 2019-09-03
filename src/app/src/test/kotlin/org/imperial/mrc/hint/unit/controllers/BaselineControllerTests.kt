package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.BaselineController
import org.junit.jupiter.api.Test
import org.mockito.internal.verification.Times
import org.springframework.http.HttpStatus
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
    fun `getPJNZ returns pjnz file data if it exists`() {

        val file = File("$tmpUploadDirectory/fake-id/pjnz/Malawi_file_name.pjnz")

        file.mkdirs()
        file.createNewFile()

        val mockFileManager = mock<FileManager> {
            on { getFile(FileType.PJNZ) } doReturn file
        }

        val sut = BaselineController(mockFileManager, getMockAPIClient(FileType.PJNZ))
        val result = sut.getPJNZ()
        val data = ObjectMapper().readTree(result)["data"].toString()
        assertThat(data)
                .isEqualTo("{\"filename\":\"Malawi_file_name.pjnz\",\"data\":{\"country\":\"Malawi\"},\"type\":\"pjnz\"}")
    }

    @Test
    fun `getPJNZ returns null if no pjnz file exists`() {

        val mockFileManager = mock<FileManager> {
            on { getFile(FileType.PJNZ) } doReturn null as File?
        }
        val sut = BaselineController(mockFileManager, getMockAPIClient(FileType.PJNZ))
        val result = sut.getPJNZ()
        val data = ObjectMapper().readTree(result)["data"].toString()
        assertThat(data)
                .isEqualTo("null")
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

    @Test
    fun `getShape returns validation result for shape file if exists`() {

        val mockFileManager = getMockFileManager(FileType.Shape)
        val mockApiClient = getMockAPIClient(FileType.Shape)
        val sut = BaselineController(mockFileManager, mockApiClient)

        val result = sut.getShape()
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        assertThat(result.body).isEqualTo("whatever")
        verify(mockApiClient).validate("test-path", FileType.Shape)
    }

    @Test
    fun `getShape returns null for shape file if it doesn't exist`() {

        val mockApiClient = getMockAPIClient(FileType.Shape)
        val sut = BaselineController(mock(), mockApiClient)

        val result = sut.getShape()
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val data = ObjectMapper().readTree(result.body)["data"].toString()
        assertThat(data).isEqualTo("null")
        verify(mockApiClient, Times(0)).validate(any(), any())
    }
}
