package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus

class ModelRunTests : SecureIntegrationTests() {

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
                "FAILED_TO_RETRIEVE_RESULT", "Failed to fetch result")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get model run options`(isAuthorized: IsAuthorized) {
        uploadMinimalFiles()
        val responseEntity = testRestTemplate.getForEntity<String>("/model/options/")
        assertSecureWithSuccess(isAuthorized, responseEntity, "ModelRunOptions")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can run model`(isAuthorized: IsAuthorized) {
        val entity = getModelRunEntity(isAuthorized)
        val responseEntity = testRestTemplate.postForEntity<String>("/model/run/", entity)
        assertSecureWithSuccess(isAuthorized, responseEntity, "ModelSubmitResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can cancel run model`(isAuthorized: IsAuthorized) {
        var modelRunId = "test"
        if (isAuthorized == IsAuthorized.TRUE) {
            val entity = getModelRunEntity(isAuthorized)
            val runResponseEntity = testRestTemplate.postForEntity<String>("/model/run/", entity)
            val bodyJSON = ObjectMapper().readTree(runResponseEntity.body)
            modelRunId = bodyJSON["data"]["id"].asText()
        }

        val responseEntity = testRestTemplate.postForEntity<String>("/model/cancel/$modelRunId")
        assertSecureWithSuccess(isAuthorized, responseEntity, "ModelCancelResponse")
    }

}
