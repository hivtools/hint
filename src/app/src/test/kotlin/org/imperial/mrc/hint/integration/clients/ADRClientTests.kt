package org.imperial.mrc.hint.integration.clients

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.junit.jupiter.api.Test

class ADRClientTests {

    @Test
    fun `can talk to ADR`() {
        val sut = ADRClient(ConfiguredAppProperties(), "fakekey")
        val response = sut.get("/organization_list_for_user")
        assertThat(response.statusCodeValue).isEqualTo(200)
        val data = ObjectMapper().readValue<JsonNode>(response.body!!)["data"]
        assertThat(data.isArray).isTrue()
        assertThat(data.count()).isEqualTo(0) // no orgs because the key isn't valid
    }
}
