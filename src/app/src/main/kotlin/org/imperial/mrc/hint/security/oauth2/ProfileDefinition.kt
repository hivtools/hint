package org.imperial.mrc.hint.security.oauth2

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.scribejava.core.model.OAuth2AccessToken
import com.github.scribejava.core.model.Token
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.db.DbConfig
import org.jooq.SQLDialect
import org.jooq.impl.DSL
import org.pac4j.core.profile.CommonProfile
import org.pac4j.oauth.config.OAuthConfiguration
import org.pac4j.oauth.profile.OAuth20Profile
import org.pac4j.oauth.profile.definition.OAuthProfileDefinition

class ProfileDefinition(
    private val appProperties: AppProperties = ConfiguredAppProperties(),
    private val objectMapper: ObjectMapper = ObjectMapper()
) : OAuthProfileDefinition()
{
    companion object {
        var token = ""
    }

    override fun extractUserProfile(body: String?): CommonProfile
    {
        val jsonBody = objectMapper.readTree(body)

        val email = jsonBody["email"].asText()

        val dataSource = DbConfig().dataSource(appProperties)

        val dslContext = DSL.using(dataSource.connection, SQLDialect.POSTGRES)

        return OAuth20Profile().apply {
            id = OAuth2UserLogicService(dslContext).run { validateUser(email) }
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
