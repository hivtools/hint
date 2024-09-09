package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.readValue
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.MetadataController
import org.imperial.mrc.hint.FileManager
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.io.File
import java.io.FileNotFoundException
import java.net.URL

class MetadataControllerTests
{
    private val tmpDir = "tmp"

    @BeforeEach
    fun makeTmpDir() {
        File(tmpDir).mkdir()
    }

    @AfterEach
    fun cleanup() {
        File(tmpDir).deleteRecursively()
    }

    @Test
    fun `getting hintr version`()
    {
        val mockResponse = mock<ResponseEntity<String>>()

        val mockAPIClient = mock<HintrAPIClient>
        {
            on { getVersion() } doReturn mockResponse
        }

        val mockFileManager = mock<FileManager> {}
        val mockClassLoader = mock<ClassLoader> {}

        val sut = MetadataController(mockAPIClient, mockClassLoader, mockFileManager)
        val result = sut.version()
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get uploadToADR metadata`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getUploadMetadata("id1") } doReturn mockResponse
        }

        val mockFileManager = mock<FileManager> {}
        val mockClassLoader = mock<ClassLoader> {}

        val sut = MetadataController(mockAPIClient, mockClassLoader, mockFileManager)
        val result = sut.uploadMetadata("id1")
        assertThat(result).isSameAs(mockResponse)
    }
}
