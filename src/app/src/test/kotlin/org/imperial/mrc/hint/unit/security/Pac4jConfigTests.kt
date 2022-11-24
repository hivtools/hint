package org.imperial.mrc.hint.unit.security

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.HintDbProfileService
import org.imperial.mrc.hint.security.Pac4jConfig
import org.imperial.mrc.hint.security.SecurePasswordEncoder
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.pac4j.core.client.BaseClient
import org.pac4j.http.client.indirect.FormClient
import org.pac4j.jee.context.session.JEESessionStore
import org.pac4j.oauth.client.OAuth20Client
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy
import org.springframework.test.context.junit.jupiter.SpringExtension
import javax.sql.DataSource

@SpringBootTest
@ExtendWith(SpringExtension::class)
class Pac4jConfigTests
{
    @Autowired
    private lateinit var wiredDataSource: DataSource

    @Autowired
    private lateinit var wiredDbProfileService: DbProfileService

    @Autowired
    private lateinit var sut: Pac4jConfig

    @Autowired
    private lateinit var userRepository: UserRepository

    @Test
    fun `can get Pac4j Config for FormLogin`()
    {
        val config = sut.getPac4jConfig(wiredDbProfileService, userRepository)

        assertThat(config.clients.callbackUrl).isEqualTo("/callback")

        assertThat(config.clients.clients.count()).isEqualTo(2)

        val client = config.clients.clients.first()

        assertThat(client).isInstanceOf(FormClient::class.java)

        val formClient = client as FormClient

        assertThat(formClient.loginUrl).isEqualTo("/login")

        assertThat(formClient.name).isEqualTo("FormClient")

        val field = BaseClient::class.java.getDeclaredField("authenticator")

        field.isAccessible = true

        assertThat(field.get(client)).isInstanceOf(DbProfileService::class.java)

        assertThat(config.sessionStore).isInstanceOf(JEESessionStore::class.java)
    }

    @Test
    fun `can get Pac4j Config for OAuth2Login`()
    {
        val config = sut.getPac4jConfig(wiredDbProfileService, userRepository)

        assertThat(config.clients.callbackUrl).isEqualTo("/callback")

        assertThat(config.clients.clients.count()).isEqualTo(2)

        val client = config.clients.clients.last()

        assertThat(client).isInstanceOf(OAuth20Client::class.java)

        val oAuth2client = client as OAuth20Client

        assertThat(oAuth2client.callbackUrl).isEqualTo("http://localhost:8080/callback/oauth2Client")

        assertThat(oAuth2client.name).isEqualTo("oauth2Client")

        assertThat(config.sessionStore).isInstanceOf(JEESessionStore::class.java)
    }

    @Test
    fun `can get dbProfileService`()
    {
        val result = sut.getProfileService(wiredDataSource)
        assertThat(result).isInstanceOf(HintDbProfileService::class.java)
        assertThat(result.dataSource).isInstanceOf(TransactionAwareDataSourceProxy::class.java)
        assertThat((result.dataSource as TransactionAwareDataSourceProxy).targetDataSource).isSameAs(wiredDataSource)
        assertThat(result.passwordEncoder).isInstanceOf(SecurePasswordEncoder::class.java)
    }
}