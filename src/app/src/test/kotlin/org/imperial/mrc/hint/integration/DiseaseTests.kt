package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Disabled
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.core.io.FileSystemResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.util.LinkedMultiValueMap
import java.io.File

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DiseaseTests(@Autowired val testRestTemplate: TestRestTemplate) {

    private val tmpUploadDirectory = "tmp"

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Disabled
    @Test
    fun `can upload survey file`() {

        val testFile = File("$tmpUploadDirectory/testfile.csv")
        testFile.parentFile.mkdirs()
        testFile.createNewFile()

        val body = LinkedMultiValueMap<String, Any>()
        body.add("file", FileSystemResource(testFile))
        val headers = HttpHeaders()
        headers.contentType = MediaType.MULTIPART_FORM_DATA

        val entity = testRestTemplate.postForEntity<String>("/disease/survey/", HttpEntity(body, headers))
        assertThat(entity.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(entity.body!!).isEqualTo("{\"status\": \"failure\", \"errors\": [], \"data\": {}}")
    }

    @Disabled
    @Test
    fun `can upload program file`() {

        val testFile = File("$tmpUploadDirectory/testfile.csv")
        testFile.parentFile.mkdirs()
        testFile.createNewFile()

        val body = LinkedMultiValueMap<String, Any>()
        body.add("file", FileSystemResource(testFile))
        val headers = HttpHeaders()
        headers.contentType = MediaType.MULTIPART_FORM_DATA

        val entity = testRestTemplate.postForEntity<String>("/disease/program/", HttpEntity(body, headers))
        assertThat(entity.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(entity.body!!).isEqualTo("{\"status\": \"failure\", \"errors\": [], \"data\": {}}")
    }

}
