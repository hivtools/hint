package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.controllers.SessionController
import org.imperial.mrc.hint.models.VersionFile
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.toJsonString
import org.junit.jupiter.api.Test

class SessionControllerTests {
    @Test
    fun `posts session files`() {
        val mockFileManager = mock<FileManager>()

        val sut = SessionController(mockFileManager)
        val files = mapOf("pjnz" to VersionFile("hash1", "file1"))
        val result = sut.postFiles(files)

        verify(mockFileManager).setAllFiles(files)
        assertThat(result.body).isEqualTo(SuccessResponse(files).toJsonString())
    }
}
