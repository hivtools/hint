package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.aspectj.lang.annotation.Before
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.ResponseEntity

class DownloadTests : SecureIntegrationTests()
{

    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }


    private fun waitForModelRunResult(): String
    {

        val entity = getModelRunEntity()
        val runResult = testRestTemplate.postForEntity<String>("/model/run/", entity)
        val id = ObjectMapper().readValue<JsonNode>(runResult.body!!)["data"]["id"].textValue()

        do
        {
            Thread.sleep(500)
            val statusResponse = testRestTemplate.getForEntity<String>("/model/status/$id")
        } while (statusResponse.body != null && statusResponse.body!!.contains("\"status\":\"RUNNING\""))

        return id
    }

    @Test
    fun `can download Spectrum results`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/spectrum/$id")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)

    }


    @Test
    fun `can download coarse output results`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/coarse-output/$id")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)

    }

    fun assertResponseHasExpectedDownloadHeaders(response: ResponseEntity<ByteArray>)
    {
        val headers = response.headers
        assertThat(headers["Content-Type"]?.first()).isEqualTo("application/octet-stream")

        val contentLength = headers["Content-Length"]?.first()!!.toInt()
        assertThat(contentLength).isGreaterThan(0)
        val bodyLength = response.body?.count()
        assertThat(contentLength).isEqualTo(bodyLength)
        assertThat(headers["Connection"]?.first()).isNotEqualTo("keep-alive")
    }
}
