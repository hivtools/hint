package org.imperial.mrc.hint.unit.security

import org.junit.jupiter.api.Test
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.security.Pac4jConfig
import org.pac4j.http.client.indirect.FormClient

class Pac4jConfigTests
{
    @Test
    fun `can get config`()
    {
        val sut = Pac4jConfig()
        val config = sut.config()

        Assertions.assertThat(config.clients.callbackUrl).isEqualTo("/callback")
        Assertions.assertThat(config.clients.clients.count()).isEqualTo(1)
        val client = config.clients.clients.first()
        Assertions.assertThat(client).isInstanceOf(FormClient::class.java)
        Assertions.assertThat((client as FormClient).loginUrl).isEqualTo("/login")
    }
}