package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
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

// These test internal HINT integration, but not integration with the ADR itself
class ADRTests : SecureIntegrationTests()
{
    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save ADR key`(isAuthorized: IsAuthorized)
    {
        val result = testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE)
        {
            assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(1)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get ADR key`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val result = testRestTemplate.getForEntity<String>("/adr/key")

        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"].asText()
            assertThat(data).isEqualTo("4c69b103-4532-4b30-8a37-27a15e56c0bb")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can delete ADR key`(isAuthorized: IsAuthorized)
    {
        val result = testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE)
        {
            assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(1)
        }

        val response = testRestTemplate.exchange<String>("/adr/key/", HttpMethod.DELETE)
        assertSecureWithSuccess(isAuthorized, response, null)

        if (isAuthorized == IsAuthorized.TRUE)
        {
            assertThat(dsl.selectFrom(ADR_KEY).count()).isEqualTo(0)
        }
    }

    @Test
    fun `can get ADR schema types`()
    {
        var result = testRestTemplate.getForEntity<String>("/adr/schemas")
        assertSuccess(result, null)
        var data = ObjectMapper().readTree(result.body!!)["data"]
        assertThat(data["pjnz"].textValue()).isEqualTo("inputs-unaids-spectrum-file")

        result = testRestTemplate.getForEntity<String>("/adr/schemas/")
        assertSuccess(result, null)
        data = ObjectMapper().readTree(result.body!!)["data"]
        assertThat(data["pjnz"].textValue()).isEqualTo("inputs-unaids-spectrum-file")
    }

    private fun getPostEntityWithKey(): HttpEntity<LinkedMultiValueMap<String, String>>
    {
        val map = LinkedMultiValueMap<String, String>()
        // this key is for a test user who has access to 1 fake dataset
        map.add("key", "4c69b103-4532-4b30-8a37-27a15e56c0bb")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }

}
