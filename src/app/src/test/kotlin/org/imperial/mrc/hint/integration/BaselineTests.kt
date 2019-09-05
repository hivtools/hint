package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity

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
    fun `can upload pjnz file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("Botswana2018.PJNZ")
        val responseEntity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateInputResponse")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload shape file`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("malawi.geojson")
        val entity = testRestTemplate.postForEntity<String>("/baseline/shape/", postEntity)
        assertSecureWithSuccess(isAuthorized, entity, "ValidateInputResponse")

        if (isAuthorized == IsAuthorized.TRUE){
            val data = getResponseData(entity)
            assertThat(data["type"].asText()).isEqualTo("shape")
        }
    }

}
