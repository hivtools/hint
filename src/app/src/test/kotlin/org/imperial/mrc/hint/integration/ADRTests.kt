package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.ADR_KEY
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap

class ADRTests : SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save ADR key`(isAuthorized: IsAuthorized) {
        val result = testRestTemplate.postForEntity<String>("/adr/key", getPostEntity())
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(1)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get ADR key`(isAuthorized: IsAuthorized) {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntity())
        val result = testRestTemplate.getForEntity<String>("/adr/key")

        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = ObjectMapper().readTree(result.body!!)["data"].asText()
            assertThat(data).isEqualTo("testkey")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can delete ADR key`(isAuthorized: IsAuthorized) {
        val result = testRestTemplate.postForEntity<String>("/adr/key", getPostEntity())
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(1)
        }

        val response = testRestTemplate.exchange<String>("/adr/key/", HttpMethod.DELETE)
        assertSecureWithSuccess(isAuthorized, response, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(0)
        }
    }

    private fun getPostEntity(): HttpEntity<LinkedMultiValueMap<String, String>> {
        val map = LinkedMultiValueMap<String, String>()
        map.add("key", "testkey")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }
}
