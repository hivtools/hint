package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.clients.FuelClient
import org.junit.jupiter.api.Test

class FuelClientTests
{
    @Test
    fun `can extend FuelClient with no baseUrl`()
    {
        val mockFuelClient = mock<FuelClient>()
        val result = mockFuelClient.postJson("http://fakepath", "")
        Assertions.assertThat(result.statusCodeValue).isEqualTo(500)
    }
}
