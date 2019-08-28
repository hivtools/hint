package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.helpers.createTestHttpEntity
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BaselineTests(@Autowired val testRestTemplate: TestRestTemplate): IntegrationTests() {

    @Test
    fun `can get baseline data`() {
        val entity = testRestTemplate.getForEntity<String>("/baseline/")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `can upload pjnz file`() {

        val postEntity = createTestHttpEntity("Malawi_2018.pjnz")
        val entity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        JSONValidator().validateSuccess(entity.body!!, "ValidateInputResponse")
    }

}
