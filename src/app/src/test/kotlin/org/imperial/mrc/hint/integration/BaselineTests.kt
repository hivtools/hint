package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.helpers.createTestHttpEntity
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus

class BaselineTests : SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get pjnz data`(isAuthorized: IsAuthorized) {
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/pjnz/")
        assertSecureWithSuccess(isAuthorized, responseEntity, null)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get shape data`(isAuthorized: IsAuthorized) {
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/shape/")
        assertSecureWithSuccess(isAuthorized, responseEntity, null)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get population data`(isAuthorized: IsAuthorized) {
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/population/")
        assertSecureWithSuccess(isAuthorized, responseEntity, null)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload pjnz file`(isAuthorized: IsAuthorized) {
        val postEntity = createTestHttpEntity("Malawi_2018.pjnz")
        val responseEntity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload shape file`(isAuthorized: IsAuthorized) {
        val postEntity = createTestHttpEntity()
        val entity = testRestTemplate.postForEntity<String>("/baseline/shape/", postEntity)
        assertSecureWithError(isAuthorized, entity, HttpStatus.BAD_REQUEST, "INVALID_FILE")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload population file`(isAuthorized: IsAuthorized) {
        val postEntity = createTestHttpEntity()
        val entity = testRestTemplate.postForEntity<String>("/baseline/population/", postEntity)
        assertSecureWithError(isAuthorized, entity, HttpStatus.BAD_REQUEST, "INVALID_FILE")
    }

}
