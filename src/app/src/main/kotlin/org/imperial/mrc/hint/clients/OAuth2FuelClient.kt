package org.imperial.mrc.hint.clients

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.security.oauth2.ProfileDefinition.Companion.token
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

interface OAuth2Client
{
    fun get(url: String): ResponseEntity<String>
}

@Component
class OAuth2FuelClient(
    appProperties: AppProperties = ConfiguredAppProperties(),
) : FuelClient(appProperties.oauth2ClientAdrUrl), OAuth2Client
{
    override fun standardHeaders(): Map<String, Any>
    {
        return mapOf("Authorization" to "Bearer $token")
    }
}
