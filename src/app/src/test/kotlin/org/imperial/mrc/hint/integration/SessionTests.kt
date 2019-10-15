package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.AssertionsForClassTypes
import org.imperial.mrc.hint.helpers.getTestEntity
import org.imperial.mrc.hint.models.SessionFile
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

class SessionTests : SecureIntegrationTests() {
    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can set session files`(isAuthorized: IsAuthorized) {
        //Get a valid hash
        var hash = ""
        if (isAuthorized == IsAuthorized.TRUE) {
            val postFileEntity = getTestEntity("Botswana2018.PJNZ")
            val uploadResult = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postFileEntity)
            hash = getResponseData(uploadResult)["hash"].textValue()
        }
        val postEntity = getJsonEntity(hash)

        val responseEntity = testRestTemplate.postForEntity<String>("/session/files/", postEntity)
        assertSecureWithSuccess(isAuthorized, responseEntity, null)

        if (isAuthorized == IsAuthorized.TRUE) {
            val data = getResponseData(responseEntity)
            AssertionsForClassTypes.assertThat(data["pjnz"]["hash"].asText()).isEqualTo(hash)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `set session files fails with invalid hash`(isAuthorized: IsAuthorized) {
        val postEntity = getJsonEntity("badhash")

        val responseEntity = testRestTemplate.postForEntity<String>("/session/files/", postEntity)
        assertSecureWithError(isAuthorized, responseEntity, HttpStatus.INTERNAL_SERVER_ERROR, "OTHER_ERROR")
    }

    private fun getJsonEntity(hash: String): HttpEntity<String> {
        val files = mapOf("pjnz" to SessionFile(hash, "file1"))
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(files)
        return HttpEntity(jsonString, headers)
    }
}