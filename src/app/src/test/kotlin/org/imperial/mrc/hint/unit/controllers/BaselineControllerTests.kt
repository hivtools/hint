package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.controllers.BaselineController
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockMultipartFile
import java.io.File

class BaselineControllerTests {

    private val tmpUploadDirectory = "tmp"


    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `can save pjnz file`() {

        val mockFileManager = mock<FileManager>()
        val sut = BaselineController(mockFileManager)

        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        sut.upload(mockFile)
        verify(mockFileManager).saveFile(mockFile, "pjnz")
    }

    @Test
    fun `returns pjnz file data if it exists`() {

        val file = File("$tmpUploadDirectory/fake-id/pjnz/Malawi_file_name.pjnz")

        file.mkdirs()
        file.createNewFile()

        val mockFileManager = mock<FileManager> {
            on { getFile("pjnz") } doReturn file
        }

        val sut = BaselineController(mockFileManager)
        assertThat(sut.get())
                .isEqualTo("{\"pjnz\": { \"filename\": \"Malawi_file_name.pjnz\", \"country\": \"Malawi\"}}")
    }

    @Test
    fun `returns null pjnz if no file exists`() {

        val mockFileManager = mock<FileManager> {
            on { getFile("pjnz") } doReturn null as File?
        }
        val sut = BaselineController(mockFileManager)
        assertThat(sut.get())
                .isEqualTo("{\"pjnz\": null}")
    }
}
