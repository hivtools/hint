package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.LocalFileManager
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockMultipartFile
import java.io.File

class LocalFileManagerTests {

    private val tmpUploadDirectory = "tmp"

    private val mockProperties = mock<AppProperties> {
        on { uploadDirectory } doReturn tmpUploadDirectory
    }

    private val mockSessionId = mock<Session> {
        on { getId() } doReturn "fake-id"
    }

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `can save file and return path`() {

        val sut = LocalFileManager(mockSessionId, mock(), mockProperties)

        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        val path = sut.saveFile(mockFile, FileType.Survey)
        val savedFile = File("$tmpUploadDirectory/$path")
        assertThat(savedFile.readLines().first()).isEqualTo("pjnz content")
    }

    @Test
    fun `empties directory if it already exists`() {

        val sut = LocalFileManager(mockSessionId, mock(), mockProperties)

        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        sut.saveFile(mockFile, FileType.PJNZ)
        var savedFiles = File("$tmpUploadDirectory/fake-id/pjnz").listFiles()
        assertThat(savedFiles?.count()).isEqualTo(1)
        assertThat(savedFiles?.first()?.readText()).isEqualTo("pjnz content")

        val newMockFile = MockMultipartFile("data", "new-file-name.pjnz",
                "application/zip", "new content".toByteArray())

        sut.saveFile(newMockFile, FileType.PJNZ)
        savedFiles = File("$tmpUploadDirectory/fake-id/pjnz").listFiles()
        assertThat(savedFiles?.count()).isEqualTo(1)
        assertThat(savedFiles?.first()?.readText()).isEqualTo("new content")
    }

    @Test
    fun `gets file if it exists`() {

        val file = File("$tmpUploadDirectory/fake-id/survey/Malawi_file_name.pjnz")

        file.mkdirs()
        file.createNewFile()

        val sut = LocalFileManager(mockSessionId, mock(), mockProperties)
        assertThat(sut.getFile(FileType.Survey)).isNotNull()
    }

    @Test
    fun `returns null if no file exists`() {

        val sut = LocalFileManager(mockSessionId, mock(), mockProperties)
        assertThat(sut.getFile(FileType.Survey))
                .isNull()
    }
}
