package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions
import org.junit.jupiter.api.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.slf4j.LoggerFactory
import org.springframework.boot.test.web.client.getForEntity

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DebugTests: SecureIntegrationTests() {
    var modelId: String? = null
    private val logger = LoggerFactory.getLogger(DebugTests::class.java)
    @BeforeAll
    fun setupModelId() {
        authorize()
        testRestTemplate.getForEntity<String>("/")
        modelId = waitForModelRunResult()
        clear()
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can download debug`(isAuthorized: IsAuthorized)
    {
        val response = testRestTemplate.getForEntity<ByteArray>("/model/debug/$modelId")
        assertSecureWithSuccess(isAuthorized, response)

        if (isAuthorized == IsAuthorized.TRUE)
        {
            val headers = response.headers
            Assertions.assertThat(headers["Content-Type"]?.first()).isEqualTo("application/octet-stream")

            val contentLength = headers["Content-Length"]?.first()!!.toInt()
            Assertions.assertThat(contentLength).isGreaterThan(0)
            val bodyLength = response.body?.count()
            Assertions.assertThat(contentLength).isEqualTo(bodyLength)
        }
    }

    private fun clear() {
        testRestTemplate.restTemplate.interceptors.clear()
    }
}
