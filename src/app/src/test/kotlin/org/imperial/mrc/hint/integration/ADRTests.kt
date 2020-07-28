package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.ADR_KEY
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap

class ADRTests : SecureIntegrationTests() {

    @BeforeEach
    fun setup() {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can save ADR key`() {
        val result = testRestTemplate.postForEntity<String>("/adr/key", getPostEntity())
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(1)
    }

    @Test
    fun `can delete ADR key`() {
        val result = testRestTemplate.postForEntity<String>("/adr/key", getPostEntity())
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(1)

        val response = testRestTemplate.exchange<String>("/adr/key/", HttpMethod.DELETE)
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(0)
    }

    private fun getPostEntity(): HttpEntity<LinkedMultiValueMap<String, String>> {
        val map = LinkedMultiValueMap<String, String>()
        map.add("key", "testkey")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }
}
