package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.LocalFileManager
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.models.SnapshotFile
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockMultipartFile
import java.io.BufferedInputStream
import java.io.File

class LocalFileManagerTests {

    private val tmpUploadDirectory = "tmp"

    private val mockProperties = mock<AppProperties> {
        on { uploadDirectory } doReturn tmpUploadDirectory
    }

    private val mockSession = mock<Session> {
        on { getSnapshotId() } doReturn "fake-id"
    }

    private val allFilesMap = FileType.values().associate {
        it.toString() to SnapshotFile("${it}hash", "${it}filename")
    }

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `saves file if file is new and returns path`() {

        val mockStateRepository = mock<SnapshotRepository> {
            on { saveNewHash(any()) } doReturn true
        }

        val sut = LocalFileManager(mockSession, mockStateRepository, mockProperties, mock())
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        val file = sut.saveFile(mockFile, FileType.Survey)
        val savedFile = File(file.path)
        assertThat(savedFile.readLines().first()).isEqualTo("pjnz content")
    }

    @Test
    fun `does not save file if file matches an existing hash and returns path`() {

        val mockStateRepository = mock<SnapshotRepository> {
            on { saveNewHash(any()) } doReturn false
        }

        val sut = LocalFileManager(mockSession, mockStateRepository, mockProperties, mock())
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        val file = sut.saveFile(mockFile, FileType.Survey)
        assertThat(file.path).isEqualTo("tmp/C7FF8823DAD31FE80CBB73D9B1FB779E.pjnz")
        assertThat(file.filename).isEqualTo("some-file-name.pjnz")
        assertThat(file.hash).isEqualTo("C7FF8823DAD31FE80CBB73D9B1FB779E.pjnz")
    }

    @Test
    fun `saves file from ADR if file is new and returns path`() {

        val mockStateRepository = mock<SnapshotRepository> {
            on { saveNewHash(any()) } doReturn true
        }
        val mockClient = mock<ADRClient> {
            on { getInputStream(any()) } doReturn BufferedInputStream("test content".byteInputStream())
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = LocalFileManager(mockSession, mockStateRepository, mockProperties, mockBuilder)

        val file = sut.saveFile("some-url/name.csv", FileType.Survey)
        val savedFile = File(file.path)
        assertThat(savedFile.readLines().first()).isEqualTo("test content")
        assertThat(file.path).isEqualTo("tmp/9473FDD0D880A43C21B7778D34872157.csv")
        assertThat(file.filename).isEqualTo("name.csv")
        assertThat(file.hash).isEqualTo("9473FDD0D880A43C21B7778D34872157.csv")
    }

    @Test
    fun `does not save file from ADR if file matches an existing hash and returns path`() {

        val mockStateRepository = mock<SnapshotRepository> {
            on { saveNewHash(any()) } doReturn false
        }
        val mockClient = mock<ADRClient> {
            on { getInputStream(any()) } doReturn BufferedInputStream("test content".byteInputStream())
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = LocalFileManager(mockSession, mockStateRepository, mockProperties, mockBuilder)
        val file = sut.saveFile("some-url/name.csv", FileType.Survey)
        assertThat(file.path).isEqualTo("tmp/9473FDD0D880A43C21B7778D34872157.csv")
        assertThat(file.filename).isEqualTo("name.csv")
        assertThat(file.hash).isEqualTo("9473FDD0D880A43C21B7778D34872157.csv")
    }

    @Test
    fun `gets file if it exists`() {

        val mockStateRepository = mock<SnapshotRepository> {
            on { saveNewHash(any()) } doReturn true
            on { getSnapshotFile(any(), any()) } doReturn SnapshotFile("test", "filename")
        }

        val sut = LocalFileManager(mockSession, mockStateRepository, mockProperties, mock())
        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        sut.saveFile(mockFile, FileType.Survey)
        assertThat(sut.getFile(FileType.Survey)!!.path).isEqualTo("tmp/test")
    }

    @Test
    fun `returns null if no file exists`() {

        val sut = LocalFileManager(mockSession, mock(), mockProperties, mock())
        assertThat(sut.getFile(FileType.Survey))
                .isNull()
    }

    @Test
    fun `gets all file paths`() {

        val stateRepo = mock<SnapshotRepository> {
            on { getHashesForSnapshot("fake-id") } doReturn mapOf("survey" to "hash.csv")
        }

        val sut = LocalFileManager(mockSession, stateRepo, mockProperties, mock())
        val result = sut.getAllHashes()

        assertThat(result["survey"]).isEqualTo("$tmpUploadDirectory/hash.csv")
        assertThat(result.count()).isEqualTo(1)
    }

    @Test
    fun `gets all files`() {

        val stateRepo = mock<SnapshotRepository> {
            on { getSnapshotFiles("fake-id") } doReturn allFilesMap
        }

        val sut = LocalFileManager(mockSession, stateRepo, mockProperties, mock())
        val result = sut.getFiles()

        assertThat(result["survey"]!!.path).isEqualTo("$tmpUploadDirectory/surveyhash")
        assertThat(result["survey"]!!.filename).isEqualTo("surveyfilename")
        assertThat(result["survey"]!!.hash).isEqualTo("surveyhash")
        assertThat(result["pjnz"]!!.path).isEqualTo("$tmpUploadDirectory/pjnzhash")
        assertThat(result["pjnz"]!!.filename).isEqualTo("pjnzfilename")
        assertThat(result["pjnz"]!!.hash).isEqualTo("pjnzhash")
        assertThat(result.count()).isEqualTo(6)
    }

    @Test
    fun `only gets files that match the given includes`() {

        val stateRepo = mock<SnapshotRepository> {
            on { getSnapshotFiles("fake-id") } doReturn allFilesMap
        }

        val sut = LocalFileManager(mockSession, stateRepo, mockProperties, mock())
        val result = sut.getFiles(FileType.ANC, FileType.Programme)

        assertThat(result.count()).isEqualTo(2)
        assertThat(result.keys).containsExactlyInAnyOrder("programme", "anc")
    }

    @Test
    fun `sets files for session`() {

        val stateRepo = mock<SnapshotRepository>()

        val sut = LocalFileManager(mockSession, stateRepo, mockProperties, mock())
        val files = mapOf("pjnz" to SnapshotFile("hash1", "file1"))
        sut.setAllFiles(files)

        verify(stateRepo).setFilesForSnapshot("fake-id", files)
    }

}
