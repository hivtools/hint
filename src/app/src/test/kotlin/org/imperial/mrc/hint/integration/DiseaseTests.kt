package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.helpers.createTestHttpEntity
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus
import java.io.File

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DiseaseTests(@Autowired val testRestTemplate: TestRestTemplate) {

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }

    @Test
    fun `can upload survey file`() {
        val postEntity = createTestHttpEntity()
        val entity = testRestTemplate.postForEntity<String>("/disease/survey/", postEntity)
        assertThat(entity.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        JSONValidator().validateError(entity.body!!, "INVALID_FILE")
    }

    @Test
    fun `can upload program file`() {
        val postEntity = createTestHttpEntity()
        val entity = testRestTemplate.postForEntity<String>("/disease/program/", postEntity)
        assertThat(entity.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        JSONValidator().validateError(entity.body!!, "INVALID_FILE")
    }

}
