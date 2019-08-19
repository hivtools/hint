package org.imperial.mrc.hint.unit.security

import org.junit.jupiter.api.Test
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.security.Pac4jConfig
import org.junit.jupiter.api.extension.ExtendWith
import org.pac4j.core.client.BaseClient
import org.pac4j.core.context.session.J2ESessionStore
import org.pac4j.http.client.indirect.FormClient
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.junit.jupiter.SpringExtension

@SpringBootTest
@ExtendWith(SpringExtension::class)
class Pac4jConfigTests
{
    @Autowired
    private lateinit var sut: Pac4jConfig

    @Test
    fun `can get config`()
    {
        val config = sut.getConfig()

        Assertions.assertThat(config.clients.callbackUrl).isEqualTo("/callback")
        Assertions.assertThat(config.clients.clients.count()).isEqualTo(1)

        val client = config.clients.clients.first()
        Assertions.assertThat(client).isInstanceOf(FormClient::class.java)
        Assertions.assertThat((client as FormClient).loginUrl).isEqualTo("/login")

        val field = BaseClient::class.java.getDeclaredField("authenticator")
        field.isAccessible = true
        Assertions.assertThat(field.get(client)).isInstanceOf(DbProfileService::class.java)

        Assertions.assertThat(config.sessionStore).isInstanceOf(J2ESessionStore::class.java)
    }
}