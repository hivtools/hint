package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType

class DownloadTests : SecureIntegrationTests() {

    private fun getModelRunJsonEntity(): HttpEntity<String> {
        val options = mapOf("sleep" to 1)
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(options)
        return HttpEntity(jsonString, headers)
    }

    private fun waitForModelRunResult(isAuthorized: IsAuthorized) : String {
        val id = when (isAuthorized) {
            IsAuthorized.TRUE -> {
                val entity = getModelRunJsonEntity()
                val runResult = testRestTemplate.postForEntity<String>("/model/run/", entity)
                ObjectMapper().readValue<JsonNode>(runResult.body!!)["data"]["id"].textValue()
            }
            IsAuthorized.FALSE -> "nonsense"
        }

        do {
            Thread.sleep(500)
            val statusResponse = testRestTemplate.getForEntity<String>("/model/status/$id")
        } while (statusResponse.body!!.contains("\"status\":\"RUNNING\""))

        return id
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can download Spectrum results`(isAuthorized: IsAuthorized) {
        val id = waitForModelRunResult(isAuthorized)
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/spectrum/$id")
        assertSecureWithSuccess(isAuthorized, responseEntity)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can download summary results`(isAuthorized: IsAuthorized) {
        val id = waitForModelRunResult(isAuthorized)
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/summary/$id")
        assertSecureWithSuccess(isAuthorized, responseEntity)
    }
}