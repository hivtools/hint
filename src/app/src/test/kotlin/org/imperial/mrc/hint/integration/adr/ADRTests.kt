package org.imperial.mrc.hint.integration.adr

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.httpPost
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.integration.SecureIntegrationTests
import org.imperial.mrc.hint.models.AdrResource
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap

// These test integration between HINT and the ADR
// so are prone to flakiness when the ADR dev server goes down
class ADRTests : SecureIntegrationTests()
{
    val ADR_KEY = "4c69b103-4532-4b30-8a37-27a15e56c0bb"
    val ADR_TEST_DATASET_NAME = "antarctica-country-estimates-2025"

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get ADR datasets`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val result = testRestTemplate.getForEntity<String>("/adr/datasets?type=input")

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
    fun `can get ADR datasets with output zip`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val result = testRestTemplate.getForEntity<String>("/adr/datasets?type=output")

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
        val id = if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(getDatasets(isAuthorized, "input").body!!)["data"]
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
    fun `can get ADR releases`(isAuthorized: IsAuthorized)
    {
        val id = if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(getDatasets(isAuthorized, "input").body!!)["data"]
            data.first()["id"].textValue()
        }
        else "fake-id"

        val result = testRestTemplate.getForEntity<String>("/adr/datasets/$id/releases")
        assertSecureWithSuccess(isAuthorized, result, null)
        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data.isArray).isTrue
        }

        // Output releases returns in same format
        val withResourceResult = testRestTemplate.getForEntity<String>("/adr/datasets/$id/releases?type=output")
        assertSecureWithSuccess(isAuthorized, withResourceResult, null)
        if (isAuthorized == IsAuthorized.TRUE)
        {
            val withResourceReleases = ObjectMapper().readTree(result.body!!)["data"]
            val allReleases = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(withResourceReleases).isEqualTo(allReleases)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get individual ADR dataset version`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())

        val name = ADR_TEST_DATASET_NAME
        val release = "Version 1.0"

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
    fun `can save files from ADR`(isAuthorized: IsAuthorized)
    {
        saveFileFromADR("inputs-unaids-spectrum-file", isAuthorized, "pjnz")
        saveFileFromADR("inputs-unaids-population", isAuthorized, "population")
        saveFileFromADR("inputs-unaids-geographic", isAuthorized, "shape")
        saveFileFromADR("inputs-unaids-naomi-output-zip", isAuthorized, "output")

        importGeoFiles(isAuthorized)

        saveFileFromADR("inputs-unaids-survey", isAuthorized, "survey")
        saveFileFromADR("inputs-unaids-anc", isAuthorized, "anc")

        // current 2025 dataset does not have VMMC outputs
        // saveFileFromADR("inputs-unaids-vmmc-coverage-outputs", isAuthorized, "vmmc")

        // this ADR file sometimes has an error, so allow for success or failure
        // but confirm expected response in each case
        val programme = extractUrl(isAuthorized, "inputs-unaids-art")
        val result = testRestTemplate.postForEntity<String>("/adr/programme",
                getPostEntityWithUrl(AdrResource(programme)))
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

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can submit rehydrate from ADR output zip`(isAuthorized: IsAuthorized)
    {
        if (isAuthorized == IsAuthorized.TRUE) {
            val resourceId = extractResourceId(isAuthorized, "inputs-unaids-naomi-output-zip")
            val file = extractUrl(isAuthorized, "inputs-unaids-naomi-output-zip")
            val postEntity = getPostEntityWithUrl(AdrResource(file, getDatasetId(isAuthorized), resourceId))
            val result = testRestTemplate.postForEntity<String>("/rehydrate/submit/adr", postEntity)
            assertSuccess(result, "ProjectRehydrateSubmitResponse")
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
            val calibrateId = waitForCalibrationResult(modelCalibrationId)
            val downloadId = waitForSubmitDownloadOutput(calibrateId, "summary")
            testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())

            val url = "/adr/datasets/hint_test/resource/${ConfiguredAppProperties().adrOutputSummarySchema}/$downloadId?resourceFileName=output.html&resourceName=TestZip&description=test"
            val createResult = testRestTemplate.postForEntity<String>(url)
            assertSuccess(createResult)
            val data = ObjectMapper().readTree(createResult.body!!)["data"]
            assertThat(data["restricted"].textValue()).isEqualTo("{\"allowed_organizations\":\"unaids\",\"allowed_users\":\"\",\"level\":\"restricted\"}")
            val resourceId = data["id"].textValue()
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

        val releaseName = "1.0"

        val result = testRestTemplate.postForEntity<String>(
                "/adr/datasets/hint_test/releases",
                getPostEntityWithKey(mapOf("name" to listOf(releaseName)))
        )

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data["name"].textValue()).isEqualTo(releaseName)

            "${ConfiguredAppProperties().adrUrl}api/3/action/version_delete".httpPost(listOf("version_id" to data["id"].textValue()))
                    .header("Authorization" to ADR_KEY)
                    .response()
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can overwrite an ADR release of the same name`(isAuthorized: IsAuthorized)
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())

        val releaseName = "1.0"

        val result = testRestTemplate.postForEntity<String>(
                "/adr/datasets/hint_test/releases",
                getPostEntityWithKey(mapOf("name" to listOf(releaseName)))
        )

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(result.body!!)["data"]
            assertThat(data["name"].textValue()).isEqualTo(releaseName)

            val result2 = testRestTemplate.postForEntity<String>(
                "/adr/datasets/hint_test/releases",
                getPostEntityWithKey(mapOf("name" to listOf(releaseName)))
            )

            val data2 = ObjectMapper().readTree(result2.body!!)["data"]
            assertThat(data2["name"].textValue()).isEqualTo(releaseName)
            assertThat(data2["id"].textValue()).isNotEqualTo(data["id"].textValue())

            "${ConfiguredAppProperties().adrUrl}api/3/action/version_delete".httpPost(listOf("version_id" to data2["id"].textValue()))
                    .header("Authorization" to ADR_KEY)
                    .response()
        }
    }

    private fun saveFileFromADR(resourceType: String, isAuthorized: IsAuthorized, adrPath: String)
    {
        val resourceId = extractResourceId(isAuthorized, resourceType)
        val file = extractUrl(isAuthorized, resourceType)
        val result = testRestTemplate.postForEntity<String>("/adr/$adrPath",
            getPostEntityWithUrl(AdrResource(file, getDatasetId(isAuthorized), resourceId)))
        assertSecureWithSuccess(isAuthorized, result, null)
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
                getPostEntityWithUrl(AdrResource(shape)))
    }

    private fun importPjnzFile(isAuthorized: IsAuthorized)
    {
        val pjnz = extractUrl(isAuthorized, "inputs-unaids-spectrum-file")
        testRestTemplate.postForEntity<String>("/adr/pjnz",
                getPostEntityWithUrl(AdrResource(pjnz)))
    }

    private fun importGeoFiles(isAuthorized: IsAuthorized)
    {
        importPjnzFile(isAuthorized)
        importShapeFile(isAuthorized)
    }

    private fun getPostEntityWithUrl(adrResource: AdrResource): HttpEntity<Map<String, String?>>
    {
        val map = mapOf(
            "url" to adrResource.url,
            "datasetId" to adrResource.datasetId,
            "resourceId" to adrResource.resourceId
        )
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        return HttpEntity(map, headers)
    }

    private fun extractUrl(isAuthorized: IsAuthorized, type: String): String
    {
        return if (isAuthorized == IsAuthorized.TRUE)
        {
            testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
            val resultWithResources = testRestTemplate.getForEntity<String>("/adr/datasets?type=input&showInaccessible=false")
            val data = ObjectMapper().readTree(resultWithResources.body!!)["data"]
            val dataset = data.find { it["name"].textValue() == ADR_TEST_DATASET_NAME }
            val resource = dataset!!["resources"].find { it["resource_type"].textValue() == type }
            resource!!["url"].textValue()
        }
        else
        {
            "fake"
        }
    }

    private fun createTestADRResource(resourceType: String): String
    {
        val response = "${ConfiguredAppProperties().adrUrl}api/3/action/resource_create".httpPost()
                .timeout(60000)
                .timeoutRead(60000)
                .header("Content-Type" to "application/json")
                .header("Authorization" to ADR_KEY)
                .body("""{"package_id": "hint_test", "resource_type": "$resourceType"}""")
                .response()
                .second

        val body = response.body().asString("application/json")
        val json = ObjectMapper().readTree(body)
        return json["result"]["id"].asText()
    }

    private fun getDatasetId(isAuthorized: IsAuthorized): String
    {
        return if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(getDatasets(isAuthorized, "input").body!!)["data"]
            data.first()["id"].textValue()
        } else "fake-id"
    }

    private fun getDatasets(isAuthorized: IsAuthorized, type: String): ResponseEntity<String>
    {
        testRestTemplate.postForEntity<String>("/adr/key", getPostEntityWithKey())
        val datasets = testRestTemplate.getForEntity<String>("/adr/datasets?type=${type}&")

        assertSecureWithSuccess(isAuthorized, datasets, null)

        return datasets
    }

    private fun extractResourceId(isAuthorized: IsAuthorized, type: String): String
    {
        return if (isAuthorized == IsAuthorized.TRUE)
        {
            val data = ObjectMapper().readTree(getDatasets(isAuthorized, "input").body!!)["data"]
            val dataset = data.find { it["name"].textValue() == ADR_TEST_DATASET_NAME }
            val resource = dataset!!["resources"].find { it["resource_type"].textValue() == type }
            resource!!["id"].textValue()
        } else "fake"
    }
}
