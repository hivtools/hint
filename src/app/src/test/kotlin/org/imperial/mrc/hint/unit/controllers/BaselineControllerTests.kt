package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.controllers.BaselineController
import org.imperial.mrc.hint.controllers.HintrController
import org.junit.jupiter.api.Test
import java.io.File

class BaselineControllerTests : HintrControllerTests() {

    override fun getSut(mockFileManager: FileManager, mockAPIClient: APIClient): HintrController {
        return BaselineController(mockFileManager, mockAPIClient)
    }

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
        assertValidates(FileType.Shape) {
            sut ->  (sut as BaselineController).uploadShape(mockFile)
        }
    }

    @Test
    fun `validates population file`() {
        assertValidates(FileType.Population) {
            sut ->  (sut as BaselineController).uploadPopulation(mockFile)
        }
    }

    @Test
    fun `getShape gets the validation result if the file exists`() {
        assertGetsIfExists(FileType.Shape) {
            sut ->  (sut as BaselineController).getShape()
        }
    }

    @Test
    fun `getPopulation gets the validation result if the file exists`() {
        assertGetsIfExists(FileType.Population) {
            sut ->  (sut as BaselineController).getPopulation()
        }
    }
}
