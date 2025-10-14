package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.AssertionsForInterfaceTypes.assertThat
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.HintPac4jConfigService
import org.imperial.mrc.hint.security.github.GitHubAuthenticator
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.pac4j.http.client.direct.DirectBearerAuthClient
import org.pac4j.http.client.indirect.FormClient
import org.pac4j.jee.context.session.JEESessionStore
import org.pac4j.oauth.client.OAuth20Client
import org.pac4j.sql.profile.service.DbProfileService

class HintPac4jConfigServiceTests
{
    companion object {
        lateinit var configService: HintPac4jConfigService
        lateinit var mockGitHubAuthenticator: GitHubAuthenticator

        @JvmStatic
        @BeforeAll
        fun setUp() {
            val mockDbProfileService = mock<DbProfileService>()
            val mockUserRepository = mock<UserRepository>()
            mockGitHubAuthenticator = mock<GitHubAuthenticator>()
            configService = HintPac4jConfigService(mockDbProfileService, mockUserRepository, mockGitHubAuthenticator)
        }
    }

    @Test
    fun `can get config`()
    {
        assertThat(configService.getConfig().clients.findAllClients().size).isEqualTo(3)
        assertThat(configService.getConfig().clients.callbackUrl).isEqualTo("/callback")
    }

    @Test
    fun `config uses JEESession storage`()
    {
        val config = configService.getConfig()

        assertThat(config.sessionStore).isInstanceOf(JEESessionStore::class.java)
    }

    @Test
    fun `configures formClient correctly`()
    {
        val formClient = configService.getConfig().clients.findClient("FormClient").get() as FormClient

        assertEquals(formClient.loginUrl, "/login")
    }

    @Test
    fun `configures oauth2 client correctly`()
    {
        val oauth2Client = configService.getConfig().clients.findClient("oauth2Client").get() as OAuth20Client

        assertEquals(oauth2Client.callbackUrl, "http://localhost:8080/callback/oauth2Client")
    }

    @Test
    fun `configures github client correctly`()
    {
        val githubClient = configService.getConfig().clients.findClient("githubClient").get() as DirectBearerAuthClient

        assertEquals(githubClient.authenticator, mockGitHubAuthenticator)
    }
}
