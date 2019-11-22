package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.helpers.getTestEntity
import org.imperial.mrc.hint.models.ModelRunOptions
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
        val versions = mapOf("hintr" to "1", "rrq" to "1", "naomi" to "1")
        val modelRunOptions = ModelRunOptions(emptyMap(), versions)
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(modelRunOptions)
        return HttpEntity(jsonString, headers)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can run model`(isAuthorized: IsAuthorized) {
        val entity = getJsonEntity()
        val responseEntity = testRestTemplate.postForEntity<String>("/model/run/", entity)
        assertSecureWithError(isAuthorized, responseEntity, HttpStatus.BAD_REQUEST, "VERSION_OUT_OF_DATE")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get model run status`(isAuthorized: IsAuthorized) {
        val responseEntity = testRestTemplate.getForEntity<String>("/model/status/1234")
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
