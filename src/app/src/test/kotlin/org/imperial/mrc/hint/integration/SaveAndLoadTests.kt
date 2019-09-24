package org.imperial.mrc.hint.integration

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity

class SaveAndLoadTests : SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save`(isAuthorized: IsAuthorized) {
        val response = testRestTemplate.getForEntity<String>("/save")

        if (isAuthorized == IsAuthorized.TRUE) {
            assertThat(response.headers["Content-Type"]!!.first()).isEqualTo("application/json");
            val attachmentHeader = response.headers["Content-Disposition"]!!.first()
            assertThat(Regex("attachment; filename=\"(.*).json\"").matches(attachmentHeader)).isTrue()
            assertThat(response.body).isEqualTo("{}")
        }
    }
}