package org.imperial.mrc.hint.security.github

import org.imperial.mrc.hint.clients.GitHubFuelClient
import org.springframework.stereotype.Service

@Service
class GitHubAuthService(
    private val githubFuelClient: GitHubFuelClient,
) {
    fun isAuthorized(githubToken: String): Pair<Boolean, String> {
        val username = githubFuelClient.getUsername(githubToken)
        return Pair(githubFuelClient.isUserInTeam(githubToken, username), username)
    }
}
