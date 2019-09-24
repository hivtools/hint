package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.LocalFileManager
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.SessionFile
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

    private val mockSession = mock<Session> {
        on { getId() } doReturn "fake-id"
    }

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `saves file if file is new and returns path`() {

        val mockStateRepository = mock<SessionRepository> {
            on { saveNewHash(any()) } doReturn true
        }

        val sut = LocalFileManager(mockSession, mockStateRepository, mockProperties)
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        val path = sut.saveFile(mockFile, FileType.Survey)
        val savedFile = File(path)
        assertThat(savedFile.readLines().first()).isEqualTo("pjnz content")
    }

    @Test
    fun `does not save file if file matches an existing hash and returns path`() {

        val mockStateRepository = mock<SessionRepository> {
            on { saveNewHash(any()) } doReturn false
        }

        val sut = LocalFileManager(mockSession, mockStateRepository, mockProperties)
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        val path = sut.saveFile(mockFile, FileType.Survey)
        assertThat(path).isEqualTo("tmp/C7FF8823DAD31FE80CBB73D9B1FB779E.pjnz")
    }

    @Test
    fun `gets file if it exists`() {

        val mockStateRepository = mock<SessionRepository> {
            on { saveNewHash(any()) } doReturn true
            on { getSessionFileHash(any(), any()) } doReturn "test"
        }

        val sut = LocalFileManager(mockSession, mockStateRepository, mockProperties)
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        sut.saveFile(mockFile, FileType.Survey)
        assertThat(sut.getFile(FileType.Survey)!!.path).isEqualTo("tmp/test")
    }

    @Test
    fun `returns null if no file exists`() {

        val sut = LocalFileManager(mockSession, mock(), mockProperties)
        assertThat(sut.getFile(FileType.Survey))
                .isNull()
    }

    @Test
    fun `gets all files`() {

        val stateRepo = mock<SessionRepository> {
            on { getFilesForSession("fake-id") } doReturn listOf(SessionFile("hash.csv", "survey"))
        }

        val sut = LocalFileManager(mockSession, stateRepo, mockProperties)
        val result = sut.getAllFiles()

        assertThat(result["survey"]).isEqualTo("$tmpUploadDirectory/hash.csv")
        assertThat(result.count()).isEqualTo(1)
    }

}
