package org.imperial.mrc.hint.integration.clients

import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.clients.ADRFuelClient
import org.imperial.mrc.hint.logging.GenericLogger
import org.junit.jupiter.api.Test
import org.mockito.Mockito

class HttpClientTests
{
    private val mockLogger = mock<GenericLogger>()

    @Test
    fun `can parse inputStream success response`()
    {
        val sut = ADRFuelClient(ConfiguredAppProperties(), "fakekey", mockLogger)
        val response = sut.getInputStream("https://mock.codes/200")
        Assertions.assertThat(response.statusCode()).isEqualTo(200)
        Assertions.assertThat(response.body().bufferedReader().use { it.readText() }).isNotBlank
        verify(mockLogger).info(Mockito.contains("ADR request time elapsed: "))
    }

    @Test
    fun `can parse inputStream server error response`()
    {
        val sut = ADRFuelClient(ConfiguredAppProperties(), "fakekey", mockLogger)
        val response = sut.getInputStream("https://mock.codes/503")
        Assertions.assertThat(response.statusCode()).isEqualTo(503)
        verify(mockLogger).info(Mockito.contains("ADR request time elapsed: "))
    }
}
