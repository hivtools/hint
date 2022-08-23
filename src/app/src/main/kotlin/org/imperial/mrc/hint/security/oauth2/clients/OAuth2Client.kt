package org.imperial.mrc.hint.security.oauth2.clients

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.security.oauth2.ProfileDefinition
import org.pac4j.core.http.callback.PathParameterCallbackUrlResolver
import org.pac4j.oauth.client.OAuth20Client
import org.pac4j.oauth.config.OAuth20Configuration
import org.pac4j.scribe.builder.api.GenericApi20

class OAuth2Client(
    private val appProperties: AppProperties = ConfiguredAppProperties(),
    private val oAuth2Client: OAuth20Client = OAuth20Client(),
    private val config: OAuth20Configuration = OAuth20Configuration()
) : CustomIndirectClient
{
    override fun client(): OAuth20Client
    {
        return oAuth2Client.apply {
            callbackUrlResolver = PathParameterCallbackUrlResolver()
            configuration = getConfig()
            name = "oauth2Client"
            callbackUrl = "http://localhost:8080/callback/oauth2Client"
        }
    }

    private fun getConfig(): OAuth20Configuration
    {
        return config.apply {
            responseType = OAuth20Configuration.OAUTH_CODE
            scope = "openid profile email"
            secret = appProperties.oauth2ClientSecret
            key = appProperties.oauth2ClientId
            profileDefinition = ProfileDefinition()
            api = GenericApi20(
                "https://${appProperties.oauth2ClientUrl}/authorize",
                "https://${appProperties.oauth2ClientUrl}/oauth/token"
            )
        }
    }
}
