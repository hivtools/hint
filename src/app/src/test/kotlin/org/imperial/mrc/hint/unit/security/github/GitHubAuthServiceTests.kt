package org.imperial.mrc.hint.unit.security.github

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.clients.GitHubApiException
import org.imperial.mrc.hint.clients.GitHubFuelClient
import org.imperial.mrc.hint.helpers.TranslationAssert.Companion.assertThatThrownBy
import org.imperial.mrc.hint.security.github.GitHubAuthService
import org.junit.jupiter.api.Test

class GitHubAuthServiceTest {

    @Test
    fun `isAuthorized returns true and username when user is in team`() {
        val token = "valid-token"
        val username = "testuser"

        val mockGithubFuelClient = mock<GitHubFuelClient> {
            on { getUsername(token) } doReturn username
            on { isUserInTeam(token, username) } doReturn true
        }

        val service = GitHubAuthService(mockGithubFuelClient)
        val result = service.isAuthorized(token)

        assertThat(result.first).isTrue()
        assertThat(result.second).isEqualTo(username)
        verify(mockGithubFuelClient).getUsername(token)
        verify(mockGithubFuelClient).isUserInTeam(token, username)
    }

    @Test
    fun `isAuthorized returns false and username when user is not in team`() {
        val token = "valid-token"
        val username = "testuser"

        val mockGithubFuelClient = mock<GitHubFuelClient> {
            on { getUsername(token) } doReturn username
            on { isUserInTeam(token, username) } doReturn false
        }

        val service = GitHubAuthService(mockGithubFuelClient)
        val result = service.isAuthorized(token)

        assertThat(result.first).isFalse()
        assertThat(result.second).isEqualTo(username)
        verify(mockGithubFuelClient).getUsername(token)
        verify(mockGithubFuelClient).isUserInTeam(token, username)
    }

    @Test
    fun `isAuthorized propagates exception from getUsername`() {
        val token = "invalid-token"
        val exception = GitHubApiException("Failed to fetch username")

        val mockGithubFuelClient = mock<GitHubFuelClient> {
            on { getUsername(token) } doThrow exception
        }

        val service = GitHubAuthService(mockGithubFuelClient)

        assertThatThrownBy {
            service.isAuthorized(token)
        }
            .isInstanceOf(GitHubApiException::class.java)
            .hasMessage("Failed to fetch username")

        verify(mockGithubFuelClient).getUsername(token)
        verify(mockGithubFuelClient, never()).isUserInTeam(any(), any())
    }
}
