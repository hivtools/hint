package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.LocalFileManager
import org.imperial.mrc.hint.db.StateRepository
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
    fun `saves file if file is new and returns path`() {

        val mockStateRepository = mock<StateRepository> {
            on { saveNewHash(any())} doReturn true
        }

        val sut = LocalFileManager(mockSessionId, mockStateRepository, mockProperties)
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        val path = sut.saveFile(mockFile, FileType.Survey)
        val savedFile = File(path)
        assertThat(savedFile.readLines().first()).isEqualTo("pjnz content")
    }

    @Test
    fun `does not save file if file matches an existing hash and returns path`() {

        val mockStateRepository = mock<StateRepository> {
            on { saveNewHash(any())} doReturn false
        }

        val sut = LocalFileManager(mockSessionId, mockStateRepository, mockProperties)
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        val path = sut.saveFile(mockFile, FileType.Survey)
        assertThat(path).isEqualTo("tmp/C7FF8823DAD31FE80CBB73D9B1FB779E.pjnz")
    }

    @Test
    fun `gets file if it exists`() {

        val mockStateRepository = mock<StateRepository> {
            on { saveNewHash(any())} doReturn true
            on { getSessionFileHash(any(), any())} doReturn "test"
        }

        val sut = LocalFileManager(mockSessionId, mockStateRepository, mockProperties)
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        sut.saveFile(mockFile, FileType.Survey)
        assertThat(sut.getFile(FileType.Survey)!!.path).isEqualTo("tmp/test")
    }

    @Test
    fun `returns null if no file exists`() {

        val sut = LocalFileManager(mockSessionId, mock(), mockProperties)
        assertThat(sut.getFile(FileType.Survey))
                .isNull()
    }
}
