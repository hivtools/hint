package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.LocalFileManager
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.springframework.mock.web.MockMultipartFile
import java.io.File

class LocalFileManagerTests {

    private val tmpUploadDirectory = "tmp"

    private val mockProperties = mock<AppProperties> {
        on { uploadDirectory } doReturn tmpUploadDirectory
    }

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `can save file and return path`() {

        val mockSessionStore = mock<SessionStore<WebContext>>() {
            on { getOrCreateSessionId(any()) } doReturn "fake-id"
        }
        val mockConfig = mock<Config> {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = LocalFileManager(mock(), mockConfig, mockProperties)

        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        val path = sut.saveFile(mockFile, FileType.Survey)
        val savedFile = File("$tmpUploadDirectory/fake-id/Survey/some-file-name.pjnz")
        Assertions.assertThat(savedFile.readLines().first()).isEqualTo("pjnz content")
        Assertions.assertThat(path).isEqualTo("fake-id/Survey/some-file-name.pjnz")
    }

    @Test
    fun `gets file if it exists`() {

        val file = File("$tmpUploadDirectory/fake-id/Survey/Malawi_file_name.pjnz")

        file.mkdirs()
        file.createNewFile()

        val mockSessionStore = mock<SessionStore<WebContext>>() {
            on { getOrCreateSessionId(any()) } doReturn "fake-id"
        }
        val mockConfig = mock<Config> {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = LocalFileManager(mock(), mockConfig, mockProperties)
        Assertions.assertThat(sut.getFile(FileType.Survey)).isNotNull()
    }

    @Test
    fun `returns null if no file exists`() {

        val mockSessionStore = mock<SessionStore<WebContext>>() {
            on { getOrCreateSessionId(any()) } doReturn "fake-id"
        }
        val mockConfig = mock<Config> {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = LocalFileManager(mock(), mockConfig, mockProperties)
        Assertions.assertThat(sut.getFile(FileType.Survey))
                .isNull()
    }

}