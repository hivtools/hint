package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.createTestHttpEntity
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity

class BaselineTests : SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get baseline data`(isAuthorized: IsAuthorized) {
        val responseEntity = testRestTemplate.getForEntity<String>("/baseline/")
        assertSecureWithSuccess(isAuthorized, responseEntity, null)
        if (isAuthorized == IsAuthorized.TRUE){
            // we can't use the JSONValidator here because this response schema isn't in the spec yet
            assertThat(responseEntity.body!!)
                    .isEqualTo("{\"errors\":[],\"status\":\"success\",\"data\":{\"pjnz\":null}}")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can upload pjnz file`(isAuthorized: IsAuthorized) {
        val postEntity = createTestHttpEntity("Malawi_2018.pjnz")
        val responseEntity = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postEntity)
        assertSecureWithSuccess(isAuthorized, responseEntity, "ValidateInputResponse")
    }

}
