package org.imperial.mrc.modelserver.integration

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
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
class BaselineTests(@Autowired val testRestTemplate: TestRestTemplate) {

    private val tmpUploadDirectory = "tmp"

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `can get baseline data`() {
        val entity = testRestTemplate.getForEntity<String>("/baseline/")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.body!!).isEqualTo("{\"pjnz\": null}")
    }

    @Test
    fun `can upload pjnz file`() {

        val testFile = File("$tmpUploadDirectory/Malawi_2018.pjnz")
        testFile.parentFile.mkdirs()
        testFile.createNewFile()

        val body = LinkedMultiValueMap<String, Any>()
        body.add("file", FileSystemResource(testFile))
        val headers = HttpHeaders()
        headers.contentType = MediaType.MULTIPART_FORM_DATA

        val entity = testRestTemplate.postForEntity<String>("/baseline/pjnz/upload/", HttpEntity(body, headers))
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.body!!).isEqualTo("{\"filename\": \"Malawi_2018.pjnz\", \"country\": \"Malawi\"}")
    }
}