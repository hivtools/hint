package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.AssertionsForInterfaceTypes.assertThat
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.HintPac4jConfigService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.pac4j.http.client.indirect.FormClient
import org.pac4j.jee.context.session.JEESessionStore
import org.pac4j.oauth.client.OAuth20Client
import org.pac4j.sql.profile.service.DbProfileService

class HintPac4jConfigServiceTests
{
    @Test
    fun `can get config`()
    {
        val mockDbProfileService = mock<DbProfileService>()

        val mockUserRepository = mock<UserRepository>()

        val sut = HintPac4jConfigService(mockDbProfileService, mockUserRepository)

        assertThat(sut.getConfig().clients.findAllClients().size).isEqualTo(2)

        assertThat(sut.getConfig().clients.callbackUrl).isEqualTo("/callback")
    }

    @Test
    fun `config uses JEESession storage`()
    {
        val mockDbProfileService = mock<DbProfileService>()

        val mockUserRepository = mock<UserRepository>()

        val sut = HintPac4jConfigService(mockDbProfileService, mockUserRepository)

        val config = sut.getConfig()

        assertThat(config.sessionStore).isInstanceOf(JEESessionStore::class.java)
    }

    @Test
    fun `configures formClient correctly`()
    {
        val mockDbProfileService = mock<DbProfileService>()

        val mockUserRepository = mock<UserRepository>()

        val sut = HintPac4jConfigService(mockDbProfileService, mockUserRepository)

        val formClient = sut.getConfig().clients.findClient("FormClient").get() as FormClient

        assertEquals(formClient.loginUrl, "/login")
    }

    @Test
    fun `configures oauth2 client correctly`()
    {
        val mockDbProfileService = mock<DbProfileService>()

        val mockUserRepository = mock<UserRepository>()

        val sut = HintPac4jConfigService(mockDbProfileService, mockUserRepository)

        val oauth2Client = sut.getConfig().clients.findClient("oauth2Client").get() as OAuth20Client

        assertEquals(oauth2Client.callbackUrl, "http://localhost:8080/callback/oauth2Client")
    }
}
