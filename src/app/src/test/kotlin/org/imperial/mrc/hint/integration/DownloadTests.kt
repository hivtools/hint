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
    fun `can download Spectrum results`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/spectrum/$id")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)

    }

    @Test
    fun `can download summary data`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/summary/$id")
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
