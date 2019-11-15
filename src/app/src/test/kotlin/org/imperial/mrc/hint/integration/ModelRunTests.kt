package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

class ModelRunTests : SecureIntegrationTests() {

    private fun getJsonEntity(): HttpEntity<String> {
        val options = mapOf("sleep" to 1)
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(options)
        return HttpEntity(jsonString, headers)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can run model`(isAuthorized: IsAuthorized) {
        val entity = getJsonEntity()
        val responseEntity = testRestTemplate.postForEntity<String>("/model/run/", entity)
        assertSecureWithSuccess(isAuthorized, responseEntity, "ModelSubmitResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get model run status`(isAuthorized: IsAuthorized) {

        val id = when (isAuthorized) {
            IsAuthorized.TRUE -> {
                val entity = getJsonEntity()
                val runResult = testRestTemplate.postForEntity<String>("/model/run/", entity)
                ObjectMapper().readValue<JsonNode>(runResult.body!!)["data"]["id"].textValue()
            }
            IsAuthorized.FALSE -> "nonsense"
        }

        val responseEntity = testRestTemplate.getForEntity<String>("/model/status/${id}")
        assertSecureWithSuccess(isAuthorized, responseEntity, "ModelStatusResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get model run result`(isAuthorized: IsAuthorized) {
        val responseEntity = testRestTemplate.getForEntity<String>("/model/result/nonsense")
        assertSecureWithError(isAuthorized,
                responseEntity,
                HttpStatus.BAD_REQUEST,
                "FAILED_TO_RETRIEVE_RESULT", "Missing some results")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get model run options`(isAuthorized: IsAuthorized) {

        testRestTemplate.postForEntity<String>("/baseline/shape/",
                getTestEntity("malawi.geojson"))

        testRestTemplate.postForEntity<String>("/disease/survey/",
                getTestEntity("survey.csv"))

        val responseEntity = testRestTemplate.getForEntity<String>("/model/options/")
        assertSecureWithSuccess(isAuthorized, responseEntity, "ModelRunOptions")
    }

}
