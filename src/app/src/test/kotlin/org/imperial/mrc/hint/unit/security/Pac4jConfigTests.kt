package org.imperial.mrc.hint.unit.security

import org.junit.jupiter.api.Test
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.HintDbProfileService
import org.imperial.mrc.hint.security.Pac4jConfig
import org.imperial.mrc.hint.security.SecurePasswordEncoder
import org.junit.jupiter.api.extension.ExtendWith
import org.pac4j.core.client.BaseClient
import org.pac4j.core.context.session.J2ESessionStore
import org.pac4j.http.client.indirect.FormClient
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

    @Test
    fun `can get Pac4j Config`()
    {
        val config = sut.getPac4jConfig(wiredDbProfileService)

        assertThat(config.clients.callbackUrl).isEqualTo("/callback")
        assertThat(config.clients.clients.count()).isEqualTo(1)

        val client = config.clients.clients.first()
        assertThat(client).isInstanceOf(FormClient::class.java)
        assertThat((client as FormClient).loginUrl).isEqualTo("/login")

        val field = BaseClient::class.java.getDeclaredField("authenticator")
        field.isAccessible = true
        assertThat(field.get(client)).isInstanceOf(DbProfileService::class.java)

        assertThat(config.sessionStore).isInstanceOf(J2ESessionStore::class.java)
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