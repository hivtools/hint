package org.imperial.mrc.hint.clients

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.security.oauth2.ProfileDefinition.Companion.token
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

interface OAuth2ADRFuelClient
{
    fun get(url: String): ResponseEntity<String>
}

@Component
class OAuth2FuelClient(
    appProperties: AppProperties = ConfiguredAppProperties(),
) : FuelClient(appProperties.oauth2ClientAdrUrl), OAuth2ADRFuelClient
{
    override fun standardHeaders(): Map<String, Any>
    {
        return mapOf("Authorization" to "Bearer $token")
    }

    override fun httpRequestHeaders(): Array<String>
    {
        return emptyArray()
    }
}
