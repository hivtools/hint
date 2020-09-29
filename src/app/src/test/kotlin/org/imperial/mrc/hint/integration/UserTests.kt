package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.postForEntity

class UserTests: SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get result for non existent user`(isAuthorized: IsAuthorized) {
        val result = testRestTemplate.postForEntity<String>("/user/bademail/exists")
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(result)
            assertThat(data.asBoolean()).isFalse()
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get result for existent user`(isAuthorized: IsAuthorized) {
        val result = testRestTemplate.postForEntity<String>("/user/test.user@example.com/exists")
        assertSecureWithSuccess(isAuthorized, result, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(result)
            assertThat(data.asBoolean()).isTrue()
        }
    }
}
