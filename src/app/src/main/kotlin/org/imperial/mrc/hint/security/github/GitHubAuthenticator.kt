package org.imperial.mrc.hint.security.github

import org.imperial.mrc.hint.AppProperties
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.credentials.Credentials
import org.pac4j.core.credentials.TokenCredentials
import org.pac4j.core.credentials.authenticator.Authenticator
import org.pac4j.core.exception.CredentialsException
import org.pac4j.core.profile.CommonProfile
import org.springframework.context.annotation.Configuration

@Configuration
class GitHubAuthenticator(
    private val githubAuthService: GitHubAuthService,
    val appProperties: AppProperties
) : Authenticator {

    override fun validate(cred: Credentials?, context: WebContext?, sessionStore: SessionStore?) {
        val credentials = cred as TokenCredentials

        val token = credentials.token
        val (isAuthorised, username) = githubAuthService.isAuthorized(token)

        when(isAuthorised) {
            true -> credentials.userProfile = CommonProfile().apply {
                id = username
            }
            false -> throw CredentialsException("Invalid GitHub token or user is not a member of team ${appProperties.githubAuthTeamSlug}")
        }
    }
}
