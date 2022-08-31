package org.imperial.mrc.hint.security.oauth2

import com.github.scribejava.core.model.OAuth2AccessToken
import com.github.scribejava.core.model.Token
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.pac4j.core.profile.CommonProfile
import org.pac4j.oauth.config.OAuthConfiguration
import org.pac4j.oauth.profile.OAuth20Profile
import org.pac4j.oauth.profile.definition.OAuthProfileDefinition

class ProfileDefinition(
    private val appProperties: AppProperties = ConfiguredAppProperties(),
) : OAuthProfileDefinition()
{
    companion object {
        var token = ""
    }

    override fun extractUserProfile(body: String?): CommonProfile
    {
        return OAuth20Profile().apply {
            id = "test.user@example.com"
        }
    }

    override fun getProfileUrl(accessToken: Token?, configuration: OAuthConfiguration?): String
    {
        accessToken.let {
           token = (accessToken as OAuth2AccessToken).accessToken
        }
        return "https://${appProperties.oauth2ClientUrl}/userinfo"
    }
}