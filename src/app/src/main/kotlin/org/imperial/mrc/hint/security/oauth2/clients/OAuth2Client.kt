package org.imperial.mrc.hint.security.oauth2.clients

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.oauth2.OAuth2LogoutActionBuilder
import org.imperial.mrc.hint.security.oauth2.OAuth2State
import org.imperial.mrc.hint.security.oauth2.ProfileDefinition
import org.pac4j.core.http.callback.PathParameterCallbackUrlResolver
import org.pac4j.oauth.client.OAuth20Client
import org.pac4j.oauth.config.OAuth20Configuration
import org.pac4j.scribe.builder.api.GenericApi20

class OAuth2Client(
    private val userRepository: UserRepository,
    private val appProperties: AppProperties = ConfiguredAppProperties(),
    private val oAuth2Client: OAuth20Client = OAuth20Client(),
    private val config: OAuth20Configuration = OAuth20Configuration(),
    private val oauth2State: OAuth2State = OAuth2State()
) : HintClients
{
    override fun hintIndirectClient(): OAuth20Client
    {
        return oAuth2Client.apply {
            callbackUrlResolver = PathParameterCallbackUrlResolver()
            configuration = getConfig()
            name = "oauth2Client"
            callbackUrl = "${appProperties.applicationUrl}/callback/oauth2Client"
            logoutActionBuilder = OAuth2LogoutActionBuilder(appProperties, oauth2State)
        }
    }

    private fun getConfig(): OAuth20Configuration
    {
        return config.apply {
            responseType = OAuth20Configuration.OAUTH_CODE
            secret = appProperties.oauth2ClientSecret
            key = appProperties.oauth2ClientId
            profileDefinition = ProfileDefinition(userRepository)
            api = GenericApi20(
                "https://${appProperties.oauth2ClientUrl}/authorize",
                "https://${appProperties.oauth2ClientUrl}/oauth/token"
            )
        }
    }
}
