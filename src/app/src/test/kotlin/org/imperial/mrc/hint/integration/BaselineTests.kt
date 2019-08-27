package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.createTestHttpEntity
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus
import java.io.File

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BaselineTests(@Autowired val testRestTemplate: TestRestTemplate) {

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

        val postEntity = createTestHttpEntity("Malawi_2018.pjnz")

        val entity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.body!!).isEqualTo("{\"filename\": \"Malawi_2018.pjnz\", \"country\": \"Malawi\"}")
    }

}
