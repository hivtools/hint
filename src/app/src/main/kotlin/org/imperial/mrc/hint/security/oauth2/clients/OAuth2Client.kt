package org.imperial.mrc.hint.security.oauth2.clients

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.security.oauth2.*
import org.pac4j.core.http.callback.PathParameterCallbackUrlResolver
import org.pac4j.oauth.client.OAuth20Client
import org.pac4j.oauth.config.OAuth20Configuration
import org.pac4j.scribe.builder.api.GenericApi20

class OAuth2Client(
    private val appProperties: AppProperties = ConfiguredAppProperties(),
    private val oAuth2Client: OAuth20Client = OAuth20Client()
) : HintClients
{
    override fun hintIndirectClient(): OAuth20Client
    {
        return oAuth2Client.apply {
            callbackUrlResolver = PathParameterCallbackUrlResolver()
            configuration = getConfig(this.configuration)
            name = "oauth2Client"
            callbackUrl = "${appProperties.applicationUrl}/callback/oauth2Client"
            logoutActionBuilder = OAuth2LogoutActionBuilder(appProperties)
            credentialsExtractor = OAuth2CredentialExtractor(this.configuration, this)
        }
    }

    private fun getConfig(config: OAuth20Configuration): OAuth20Configuration
    {
        return config.apply {
            responseType = OAuth20Configuration.OAUTH_CODE
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
