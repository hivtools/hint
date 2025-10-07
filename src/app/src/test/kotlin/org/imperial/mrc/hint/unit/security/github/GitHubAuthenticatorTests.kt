package org.imperial.mrc.hint.unit.security.github

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.github.GitHubAuthService
import org.imperial.mrc.hint.security.github.GitHubAuthenticator
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.junit.jupiter.MockitoExtension
import org.pac4j.core.credentials.TokenCredentials
import org.pac4j.core.exception.CredentialsException
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore

@ExtendWith(MockitoExtension::class)
class GitHubAuthenticatorTest {

    @Test
    fun `validate sets user profile when user is authorized`() {
        val token = "valid-token"
        val username = "testuser"

        val mockGithubAuthService = mock<GitHubAuthService> {
            on { isAuthorized(token) } doReturn Pair(true, username)
        }
        val mockAppProperties = mock<AppProperties>()
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore>()

        val authenticator = GitHubAuthenticator(mockGithubAuthService, mockAppProperties)
        val credentials = TokenCredentials(token)

        authenticator.validate(credentials, mockWebContext, mockSessionStore)

        assertThat(credentials.userProfile).isNotNull
        assertThat(credentials.userProfile.id).isEqualTo(username)
        verify(mockGithubAuthService).isAuthorized(token)
    }

    @Test
    fun `validate throws CredentialsException when user is not authorized`() {
        val token = "invalid-token"
        val username = "unauthorizeduser"
        val teamSlug = "my-team"

        val mockGithubAuthService = mock<GitHubAuthService> {
            on { isAuthorized(token) } doReturn Pair(false, username)
        }
        val mockAppProperties = mock<AppProperties> {
            on { githubAuthTeamSlug } doReturn teamSlug
        }
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore>()

        val authenticator = GitHubAuthenticator(mockGithubAuthService, mockAppProperties)
        val credentials = TokenCredentials(token)

        assertThatThrownBy {
            authenticator.validate(credentials, mockWebContext, mockSessionStore)
        }
            .isInstanceOf(CredentialsException::class.java)
            .hasMessageContaining("Invalid GitHub token or user is not a member of team $teamSlug")

        verify(mockGithubAuthService).isAuthorized(token)
    }
}
