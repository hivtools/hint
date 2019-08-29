package org.imperial.mrc.hint.integration

import org.imperial.mrc.hint.helpers.createTestHttpEntity
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus

class DiseaseTests: SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload survey file`(isAuthorized: IsAuthorized) {
        val postEntity = createTestHttpEntity()
        val entity = testRestTemplate.postForEntity<String>("/disease/survey/", postEntity)
        assertSecureWithError(isAuthorized, entity, HttpStatus.BAD_REQUEST, "INVALID_FILE")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload program file`(isAuthorized: IsAuthorized) {
        val postEntity = createTestHttpEntity()
        val entity = testRestTemplate.postForEntity<String>("/disease/program/", postEntity)
        assertSecureWithError(isAuthorized, entity, HttpStatus.BAD_REQUEST, "INVALID_FILE")
    }

}
