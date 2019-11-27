package org.imperial.mrc.hint.integration

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
                "FAILED_TO_RETRIEVE_RESULT", "Missing some results")
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

}
