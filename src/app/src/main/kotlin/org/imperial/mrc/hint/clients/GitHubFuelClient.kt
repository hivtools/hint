package org.imperial.mrc.hint.clients

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.core.Headers
import com.github.kittinunf.fuel.httpGet
import org.imperial.mrc.hint.AppProperties
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

interface GitHubClient {
    fun getUsername(token: String): String
    fun isUserInTeam(token: String, username: String): Boolean
}

@Component
class GitHubFuelClient(
    val objectMapper: ObjectMapper,
    val appProperties: AppProperties
) : FuelClient(appProperties.githubAuthBaseUrl), GitHubClient {

    override fun standardHeaders(): Map<String, Any> {
        return emptyMap()
    }

    override fun getUsername(token: String): String {
        val (_, response, result) = "$baseUrl/user".httpGet()
            .header(Headers.AUTHORIZATION, "Bearer $token")
            .addTimeouts()
            .responseString()

        return result.fold(
            success = { body ->
                val json = objectMapper.readTree(body)
                json["login"]?.asText() ?: throw GitHubApiException("No login field in response")
            },
            failure = { error ->
                throw GitHubApiException("Failed to fetch username: ${response.statusCode} ${error.message}")
            }
        )
    }

    override fun isUserInTeam(token: String, username: String): Boolean {
        val (_, response, result) =
            ("$baseUrl/orgs/${appProperties.githubAuthOrg}/teams/" +
                    "${appProperties.githubAuthTeamSlug}/memberships/$username")
                .httpGet()
                .header(Headers.AUTHORIZATION, "Bearer $token")
                .addTimeouts()
                .responseString()

        return result.fold(
            success = { true }, // If we got 200 OK, user is in team
            failure = { error ->
                if (response.statusCode == HttpStatus.NOT_FOUND.value()) {
                    false
                } else {
                    throw GitHubApiException("Failed to check team membership: ${response.statusCode} ${error.message}")
                }
            }
        )
    }
}

class GitHubApiException(message: String) : RuntimeException(message)
