package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.controllers.BaselineController
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.springframework.mock.web.MockMultipartFile
import java.io.File

class BaselineControllerTests {

    private val tmpUploadDirectory = "tmp"

    private val mockProperties = mock<AppProperties> {
        on { uploadDirectory } doReturn tmpUploadDirectory
    }

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `can save pjnz file`() {

        val mockSessionStore = mock<SessionStore<WebContext>>() {
            on { getOrCreateSessionId(any()) } doReturn "fake-id"
        }
        val mockConfig = mock<Config> {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = BaselineController(mock(), mockConfig, mockProperties)

        val mockFile = MockMultipartFile("data", "some-file-name.pjnz",
                "application/zip", "pjnz content".toByteArray())

        sut.upload(mockFile)
        val savedFile = File("$tmpUploadDirectory/fake-id/pjnz/some-file-name.pjnz")
        assertThat(savedFile.readLines().first()).isEqualTo("pjnz content")
    }

    @Test
    fun `returns pjnz file data if it exists`() {

        val file = File("$tmpUploadDirectory/fake-id/pjnz/Malawi_file_name.pjnz")

        file.mkdirs()
        file.createNewFile()

        val mockSessionStore = mock<SessionStore<WebContext>>() {
            on { getOrCreateSessionId(any()) } doReturn "fake-id"
        }
        val mockConfig = mock<Config> {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = BaselineController(mock(), mockConfig, mockProperties)
        assertThat(sut.get())
                .isEqualTo("{\"pjnz\": { \"filename\": \"Malawi_file_name.pjnz\", \"country\": \"Malawi\"}}")
    }

    @Test
    fun `returns null pjnz if no file exists`() {

        val mockSessionStore = mock<SessionStore<WebContext>>() {
            on { getOrCreateSessionId(any()) } doReturn "fake-id"
        }
        val mockConfig = mock<Config> {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = BaselineController(mock(), mockConfig, mockProperties)
        assertThat(sut.get())
                .isEqualTo("{\"pjnz\": null}")
    }
}
