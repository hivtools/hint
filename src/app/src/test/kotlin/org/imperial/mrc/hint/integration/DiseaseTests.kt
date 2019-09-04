package org.imperial.mrc.hint.integration

import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus

class DiseaseTests: SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload survey file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("survey.csv")
        val entity = testRestTemplate.postForEntity<String>("/disease/survey/", postEntity)
        assertSecureWithError(isAuthorized, entity, HttpStatus.BAD_REQUEST, "INVALID_FILE")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload program file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("programme.csv")
        val entity = testRestTemplate.postForEntity<String>("/disease/program/", postEntity)
        assertSecureWithError(isAuthorized, entity, HttpStatus.BAD_REQUEST, "INVALID_FILE")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload ANC file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("anc.csv")
        val entity = testRestTemplate.postForEntity<String>("/disease/anc/", postEntity)
        assertSecureWithSuccess(isAuthorized, entity, "ValidateInputResponse")
    }
}
