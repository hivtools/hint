package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.AssertionsForClassTypes
import org.imperial.mrc.hint.helpers.getTestEntity
import org.imperial.mrc.hint.models.SnapshotFile
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

class SessionTests : SecureIntegrationTests() {

    @BeforeEach
    fun setup() {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can set session files`() {

        val postFileEntity = getTestEntity("Botswana2018.PJNZ")
        val uploadResult = testRestTemplate.postForEntity<String>("/baseline/pjnz/", postFileEntity)
        val hash = getResponseData(uploadResult)["hash"].textValue()

        val postEntity = getJsonEntity(hash)

        val responseEntity = testRestTemplate.postForEntity<String>("/session/files/", postEntity)
        assertSuccess(responseEntity, null)

        val data = getResponseData(responseEntity)
        AssertionsForClassTypes.assertThat(data["pjnz"]["hash"].asText()).isEqualTo(hash)
    }


    @Test
    fun `set session files fails with invalid hash`() {
        val postEntity = getJsonEntity("badhash")

        val responseEntity = testRestTemplate.postForEntity<String>("/session/files/", postEntity)
        assertError(responseEntity, HttpStatus.BAD_REQUEST, "OTHER_ERROR")
    }

    private fun getJsonEntity(hash: String): HttpEntity<String> {
        val files = mapOf("pjnz" to SnapshotFile(hash, "file1"))
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(files)
        return HttpEntity(jsonString, headers)
    }
}
