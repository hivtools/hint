package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.http.ResponseEntity

class DownloadTests : SecureIntegrationTests()
{

    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can request for download submit`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/submit/spectrum/$id")
        assertSuccess(responseEntity)
    }

    @Test
    fun `can request for download submit status`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/submit/status/$id")
        assertSuccess(responseEntity)
    }

    @Test
    fun `downloads submit result`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/submit/result/$id")
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
