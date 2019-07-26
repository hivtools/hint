package org.imperial.mrc.modelserver.integration

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ModelserverApplicationTests(@Autowired val restTemplate: TestRestTemplate) {

	@Test
	fun contextLoads() {
	}

	@Test
	fun `Assert redirects to login page`() {
        val entity = restTemplate.getForEntity<String>("/")
        assertThat(entity.body!!).contains("Log In")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
	}

}
