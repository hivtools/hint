package org.imperial.mrc.hint.integration.adr

import com.github.kittinunf.fuel.httpPost
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.integration.SecureIntegrationTests
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.util.LinkedMultiValueMap
import java.time.Instant

// These test integration between HINT and the ADR
// so are prone to flakiness when the ADR dev server goes down
class ADRTests : SecureIntegrationTests()
{
    val ADR_KEY = "4c69b103-4532-4b30-8a37-27a15e56c0bb"

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get ADR datasets`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val result = testRestTemplate.getForEntity<String>("/adr/datasets")

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data.isArray).isTrue()
            // the test api key has access to at least 1 dataset
            assertThat(data.any()).isTrue()
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get individual ADR dataset`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val datasets = testRestTemplate.getForEntity<String>("/adr/datasets")

        assertSecureWithSuccess(isAuthorized, datasets, null)

        val id = if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(datasets.body!!)["data"]
            data.first()["id"].textValue()
        }
        else "fake-id"

        val result = testRestTemplate.getForEntity<String>("/adr/datasets/$id")
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data["id"].textValue()).isEqualTo(id)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get individual ADR dataset version`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())

        val name = "antarctica-inputs-unaids-estimates-2021"
        val release = "1.0"

        val result = testRestTemplate.getForEntity<String>("/adr/datasets/$name?release=$release")
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data["name"].textValue()).isEqualTo(name)
            assertThat(data["resources"].size()).isGreaterThan(0)
            assertThat(data["resources"][0]["url"].textValue().contains ("?activity_id="))
            assertThat(data["resources"]).allMatch { it["url"].textValue().contains("?activity_id=") }
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get orgs with permission`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val result = testRestTemplate.getForEntity<String>("/adr/orgs?permission=update_dataset")

        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data.count()).isEqualTo(1)
            assertThat(data[0]["name"].textValue()).isEqualTo("naomi-development-team")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save pjnz from ADR`(isAuthorized: IsAuthorized)
    {
        val pjnz = extractUrl(isAuthorized, "inputs-unaids-spectrum-file")
        val result = testRestTemplate.postForEntity<String>("/adr/pjnz",
                getPostEntityWithUrl(pjnz))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save population from ADR`(isAuthorized: IsAuthorized)
    {
        val population = extractUrl(isAuthorized, "inputs-unaids-population")
        val result = testRestTemplate.postForEntity<String>("/adr/population",
                getPostEntityWithUrl(population))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save shape from ADR`(isAuthorized: IsAuthorized)
    {
        val shape = extractUrl(isAuthorized, "inputs-unaids-geographic")
        val result = testRestTemplate.postForEntity<String>("/adr/shape",
                getPostEntityWithUrl(shape))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save survey from ADR`(isAuthorized: IsAuthorized)
    {
        importShapeFile(isAuthorized)

        val survey = extractUrl(isAuthorized, "inputs-unaids-survey")
        val result = testRestTemplate.postForEntity<String>("/adr/survey",
                getPostEntityWithUrl(survey))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save ANC from ADR`(isAuthorized: IsAuthorized)
    {
        importShapeFile(isAuthorized)

        val anc = extractUrl(isAuthorized, "inputs-unaids-anc")
        val result = testRestTemplate.postForEntity<String>("/adr/anc",
                getPostEntityWithUrl(anc))
        assertSecureWithSuccess(isAuthorized, result, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save programme from ADR`(isAuthorized: IsAuthorized)
    {
        importShapeFile(isAuthorized)

        val programme = extractUrl(isAuthorized, "inputs-unaids-art")
        val result = testRestTemplate.postForEntity<String>("/adr/programme",
                getPostEntityWithUrl(programme))

        // this ADR file sometimes has an error, so allow for success or failure
        // but confirm expected response in each case
        when (isAuthorized)
        {
            IsAuthorized.TRUE ->
            {
                assertThat(result.headers.contentType!!.toString())
                        .contains("application/json")

                if (result.statusCode == HttpStatus.OK)
                {
                    JSONValidator().validateSuccess(result.body!!, "ValidateInputResponse")
                }
                else
                {
                    JSONValidator().validateError(result.body!!, "INVALID_FILE")
                }

            }
            IsAuthorized.FALSE ->
            {
                assertUnauthorized(result)
            }
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

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can push output file to ADR`(isAuthorized: IsAuthorized)
    {
        if (isAuthorized == IsAuthorized.TRUE) {
            val modelCalibrationId = waitForModelRunResult()
            testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())

            val url = "/adr/datasets/hint_test/resource/${ConfiguredAppProperties().adrOutputSummarySchema}/$modelCalibrationId?resourceFileName=output.html&resourceName=TestZip&description=test"
            val createResult = testRestTemplate.postForEntity<String>(url)
            assertSuccess(createResult)
            val resourceId = ObjectMapper().readTree(createResult.body!!)["data"]["id"].textValue()
            val updateResult = testRestTemplate.postForEntity<String>("$url&resourceId=$resourceId")
            assertSuccess(updateResult)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can push input file to ADR`(isAuthorized: IsAuthorized)
    {
        if (isAuthorized == IsAuthorized.TRUE) {

            val modelCalibrationId = waitForModelRunResult()
            testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())

            val resourceType = ConfiguredAppProperties().adrPJNZSchema
            //We need to create a resource directly on ADR as our endpoint requires input resources to pre-exist
            val resourceId = createTestADRResource(resourceType)

            val qs = "resourceFileName=input.pjnz&resourceName=TestPJNZ&resourceId=$resourceId"
            val url = "/adr/datasets/hint_test/resource/${resourceType}/$modelCalibrationId?$qs"

            val updateResult = testRestTemplate.postForEntity<String>(url)
            assertSuccess(updateResult)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can create an ADR release`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())

        val dataset = "burundi-inputs-unaids-estimates-2021"

        createTestADRResource(ConfiguredAppProperties().adrOutputSummarySchema, dataset)

        val releaseName = Instant.now().toString()

        val result = testRestTemplate.postForEntity<String>(
                "/adr/datasets/$dataset/releases",
                getPostEntityWithKey(mapOf("name" to listOf(releaseName)))
        )

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data["name"].textValue()).isEqualTo(releaseName)
        }
    }

    private fun getPostEntityWithKey(values: Map<String, List<String>> = emptyMap()): HttpEntity<LinkedMultiValueMap<String, String>>
    {
        val map = LinkedMultiValueMap<String, String>()
        // this key is for a test user who has access to 1 fake dataset
        map.add("key", ADR_KEY)
        map.addAll(LinkedMultiValueMap(values))
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }

    private fun importShapeFile(isAuthorized: IsAuthorized)
    {
        val shape = extractUrl(isAuthorized, "inputs-unaids-geographic")
        testRestTemplate.postForEntity<String>("/adr/shape",
                getPostEntityWithUrl(shape))
    }

    private fun getPostEntityWithUrl(url: String): HttpEntity<LinkedMultiValueMap<String, String>>
    {
        val map = LinkedMultiValueMap<String, String>()
        map.add("url", url)
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }

    private fun extractUrl(isAuthorized: IsAuthorized, type: String): String
    {
        return if (isAuthorized == IsAuthorized.TRUE)
        {
            testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
            val resultWithResources = testRestTemplate.getForEntity<String>("/adr/datasets?showInaccessible=false")
            val data = ObjectMapper().readTree(resultWithResources.body!!)["data"]
            val dataset = data.find { it["name"].textValue() == "antarctica-inputs-unaids-estimates-2021" }
            val resource = dataset!!["resources"].find { it["resource_type"].textValue() == type }
            resource!!["url"].textValue()
        }
        else
        {
            "fake"
        }
    }

    private fun createTestADRResource(resourceType: String, dataset: String = "hint_test"): String
    {
        val response = "${ConfiguredAppProperties().adrUrl}api/3/action/resource_create".httpPost()
                .timeout(60000)
                .timeoutRead(60000)
                .header("Content-Type" to "application/json")
                .header("Authorization" to ADR_KEY)
                .body("""{"package_id": "$dataset", "resource_type": "$resourceType"}""")
                .response()
                .second

        val body = response.body().asString("application/json")
        val json = ObjectMapper().readTree(body)
        return json["result"]["id"].asText()
    }
}
