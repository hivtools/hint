package org.imperial.mrc.hint.integration

import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity

class MetadataTests : SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get metadata`(isAuthorized: IsAuthorized) {
        val responseEntity = testRestTemplate.getForEntity<String>("/plotting/MWI/")
        assertSecureWithSuccess(isAuthorized, responseEntity, "PlottingMetadataResponse")
    }
}
