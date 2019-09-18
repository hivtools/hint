package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.models.ModelRunParameters
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType

class ModelRunTests : SecureIntegrationTests() {

    private fun getJsonEntity(): HttpEntity<String> {
        val params = ModelRunParameters(1,1,1,mapOf())
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(params)
        return HttpEntity(jsonString, headers)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can run model`(isAuthorized: IsAuthorized) {
        val entity = getJsonEntity()
        val responseEntity = testRestTemplate.postForEntity<String>("/model/run/", entity)
        assertSecureWithSuccess(isAuthorized, responseEntity, "ModelSubmitResponse")
    }
}
