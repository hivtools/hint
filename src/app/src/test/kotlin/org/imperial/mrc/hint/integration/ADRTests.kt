package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.isA
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.ADR_KEY
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
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
            assertThat(data).isEqualTo("4c69b103-4532-4b30-8a37-27a15e56c0bb")
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
            // the test api key has access to exactly 1 dataset
            assertThat(data.count()).isEqualTo(1)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get individual ADR dataset`(isAuthorized: IsAuthorized) {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val datasets = testRestTemplate.getForEntity<String>("/adr/datasets")

        val id = if (isAuthorized == IsAuthorized.TRUE) {
            val data = ObjectMapper().readTree(datasets.body!!)["data"]
            data.first()["id"].textValue()
        }
        else "fake-id"

        val result = testRestTemplate.getForEntity<String>("/adr/datasets/$id")
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data["id"].textValue()).isEqualTo(id)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save pjnz from ADR`(isAuthorized: IsAuthorized) {
        val pjnz = extractUrl(isAuthorized, "inputs-unaids-spectrum-file")
        val result = testRestTemplate.postForEntity<String>("/adr/pjnz",
                getPostEntityWithUrl(pjnz))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save population from ADR`(isAuthorized: IsAuthorized) {
        val population = extractUrl(isAuthorized, "inputs-unaids-population")
        val result = testRestTemplate.postForEntity<String>("/adr/population",
                getPostEntityWithUrl(population))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save shape from ADR`(isAuthorized: IsAuthorized) {
        val shape = extractUrl(isAuthorized, "inputs-unaids-geographic")
        val result = testRestTemplate.postForEntity<String>("/adr/shape",
                getPostEntityWithUrl(shape))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save survey from ADR`(isAuthorized: IsAuthorized) {
        importShapeFile(isAuthorized)

        val survey = extractUrl(isAuthorized, "inputs-unaids-survey")
        val result = testRestTemplate.postForEntity<String>("/adr/survey",
                getPostEntityWithUrl(survey))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save ANC from ADR`(isAuthorized: IsAuthorized) {
        importShapeFile(isAuthorized)

        val anc = extractUrl(isAuthorized, "inputs-unaids-anc")
        val result = testRestTemplate.postForEntity<String>("/adr/anc",
                getPostEntityWithUrl(anc))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save programme from ADR`(isAuthorized: IsAuthorized) {
        importShapeFile(isAuthorized)

        val programme = extractUrl(isAuthorized, "inputs-unaids-art")
        val result = testRestTemplate.postForEntity<String>("/adr/programme",
                getPostEntityWithUrl(programme))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @Test
    fun `can get ADR schema types`() {
        var result = testRestTemplate.getForEntity<String>("/adr/schemas")
        assertSuccess(result, null)
        var data = ObjectMapper().readTree(result.body!!)["data"]
        assertThat(data["pjnz"].textValue()).isEqualTo("inputs-unaids-spectrum-file")

        result = testRestTemplate.getForEntity<String>("/adr/schemas/")
        assertSuccess(result, null)
        data = ObjectMapper().readTree(result.body!!)["data"]
        assertThat(data["pjnz"].textValue()).isEqualTo("inputs-unaids-spectrum-file")
    }

    private fun getPostEntityWithKey(): HttpEntity<LinkedMultiValueMap<String, String>> {
        val map = LinkedMultiValueMap<String, String>()
        // this key is for a test user who has access to 1 fake dataset
        map.add("key", "4c69b103-4532-4b30-8a37-27a15e56c0bb")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }

    private fun importShapeFile(isAuthorized: IsAuthorized) {
        val shape = extractUrl(isAuthorized, "inputs-unaids-geographic")
        testRestTemplate.postForEntity<String>("/adr/shape",
                getPostEntityWithUrl(shape))
    }

    private fun getPostEntityWithUrl(url: String): HttpEntity<LinkedMultiValueMap<String, String>> {
        val map = LinkedMultiValueMap<String, String>()
        map.add("url", url)
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }

    private fun extractUrl(isAuthorized: IsAuthorized, type: String): String {
        return if (isAuthorized == IsAuthorized.TRUE) {
            testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
            val resultWithResources = testRestTemplate.getForEntity<String>("/adr/datasets?showInaccessible=true")
            val data = ObjectMapper().readTree(resultWithResources.body!!)["data"]
            val resource = data[0]["resources"].find { it["resource_type"].textValue() == type }
            resource!!["url"].textValue()
        } else {
            "fake"
        }
    }
}
