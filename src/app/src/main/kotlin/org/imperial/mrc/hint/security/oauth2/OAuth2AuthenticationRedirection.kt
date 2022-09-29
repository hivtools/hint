package org.imperial.mrc.hint.security.oauth2

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder
import java.net.URI
import java.util.*

@Component
class OAuth2AuthenticationRedirection(
    protected val appProperties: AppProperties
)
{
    fun oauth2LoginRedirect(session: Session): ResponseEntity<String>
    {
        val stateParam = session.generateStateParameter()

        val encodedStateParam = Base64.getEncoder().encodeToString(stateParam.toByteArray())

        val url = UriComponentsBuilder
            .fromHttpUrl("https://${appProperties.oauth2ClientUrl}")
            .path("/authorize")
            .queryParam("response_type", "code")
            .queryParam("client_id", appProperties.oauth2ClientId)
            .queryParam("state", encodedStateParam)
            .queryParam("scope", "openid+profile+email+read:dataset")
            .queryParam("audience", appProperties.oauth2ClientAudience)
            .queryParam("redirect_uri", "${appProperties.applicationUrl}/callback/oauth2Client")
            .build()

        val httpHeader = HttpHeaders()
        httpHeader.location = URI(url.toUriString())
        return ResponseEntity(httpHeader, HttpStatus.SEE_OTHER)
    }

    fun oauth2LogoutRedirect(): String
    {
        return UriComponentsBuilder
            .fromHttpUrl("https://${appProperties.oauth2ClientUrl}")
            .path("/v2/logout")
            .queryParam("client_id", appProperties.oauth2ClientId)
            .queryParam("returnTo", "${appProperties.applicationUrl}/login")
            .build().toString()
    }
}
