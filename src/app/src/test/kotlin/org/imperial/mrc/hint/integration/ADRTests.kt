package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.isA
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
        val result = testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(1)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get ADR key`(isAuthorized: IsAuthorized) {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
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
        val result = testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
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

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get ADR datasets`(isAuthorized: IsAuthorized) {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val result = testRestTemplate.getForEntity<String>("/adr/datasets")

        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data.isArray).isTrue()
            // we used a fake key so no results will come back
            assertThat(data.count()).isEqualTo(0)
        }

        val resultWithResources = testRestTemplate.getForEntity<String>("/adr/datasets?showInaccessible=true")
        if (isAuthorized == IsAuthorized.TRUE) {
            val data = ObjectMapper().readTree(resultWithResources.body!!)["data"]
            assertThat(data.isArray).isTrue()
            // with the showInaccessible flag set, we can see packages
            // that aren't actually accessible to our fake user
            assertThat(data.count()).isEqualTo(3)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save file from ADR`(isAuthorized: IsAuthorized) {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val resultWithResources = testRestTemplate.getForEntity<String>("/adr/datasets?showInaccessible=true")
        val pjnz = if (isAuthorized == IsAuthorized.TRUE) {
            val data = ObjectMapper().readTree(resultWithResources.body!!)["data"]
            val pjnz = data[0]["resources"].find { it["resource_type"].textValue() == "inputs-unaids-spectrum-file" }
            pjnz!!["url"].textValue()
        } else {
            "fake"
        }
        val result = testRestTemplate.postForEntity<String>("/adr/file",
                getPostEntityWithUrl(pjnz, "inputs-unaids-spectrum-file"))
        assertSecureWithError(isAuthorized, result, HttpStatus.INTERNAL_SERVER_ERROR, "OTHER_ERROR")
        //assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")

    }

    private fun getPostEntityWithKey(): HttpEntity<LinkedMultiValueMap<String, String>> {
        val map = LinkedMultiValueMap<String, String>()
        map.add("key", "testkey")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }

    private fun getPostEntityWithUrl(url: String, type: String): HttpEntity<LinkedMultiValueMap<String, String>> {
        val map = LinkedMultiValueMap<String, String>()
        map.add("url", url)
        map.add("type", type)
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }
}
