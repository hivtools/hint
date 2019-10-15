package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.LocalFileManager
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.SessionFile
import org.imperial.mrc.hint.models.SessionFileWithPath
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

        val file = sut.saveFile(mockFile, FileType.Survey)
        val savedFile = File(file.path)
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

        val file = sut.saveFile(mockFile, FileType.Survey)
        assertThat(file.path).isEqualTo("tmp/C7FF8823DAD31FE80CBB73D9B1FB779E.pjnz")
        assertThat(file.filename).isEqualTo("some-file-name.pjnz")
        assertThat(file.hash).isEqualTo("C7FF8823DAD31FE80CBB73D9B1FB779E.pjnz")
    }

    @Test
    fun `gets file if it exists`() {

        val mockStateRepository = mock<SessionRepository> {
            on { saveNewHash(any()) } doReturn true
            on { getSessionFile(any(), any()) } doReturn SessionFile("test", "filename")
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
            on { getHashesForSession("fake-id") } doReturn mapOf("survey" to "hash.csv")
        }

        val sut = LocalFileManager(mockSession, stateRepo, mockProperties)
        val result = sut.getAllFiles()

        assertThat(result["survey"]).isEqualTo("$tmpUploadDirectory/hash.csv")
        assertThat(result.count()).isEqualTo(1)
    }

    @Test
    fun `sets files for session`() {

        val stateRepo = mock<SessionRepository>()

        val sut = LocalFileManager(mockSession, stateRepo, mockProperties)
        val files = mapOf("pjnz" to SessionFile("hash1", "file1"))
        sut.setAllFiles(files)

        verify(stateRepo).setFilesForSession("fake-id", files)
    }

}
