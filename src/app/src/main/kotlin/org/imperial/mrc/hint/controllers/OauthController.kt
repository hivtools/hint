package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.clients.OAuth2FuelClient
import org.imperial.mrc.hint.security.oauth2.OAuth2Generator
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.util.UriComponentsBuilder
import java.net.URI

@RestController
@RequestMapping("oauth2")
class OauthController(
    private val oAuth2Generator: OAuth2Generator = OAuth2Generator(),
    private val oAuth2FuelClient: OAuth2FuelClient,
    private val appProperties: AppProperties = ConfiguredAppProperties(),
)
{
    @GetMapping("/authenticated")
    fun authenticated(): ResponseEntity<String>
    {
        return oAuth2FuelClient.get("authenticated/dataset")
    }

    @GetMapping("/authorisation")
    fun authorisation(): ResponseEntity<String>
    {
        println("Getting to this point")
   
        return oAuth2FuelClient.get("authorisation/dataset")
    }

    @GetMapping("/login")
    fun login(): ResponseEntity<String>
    {
        val url = UriComponentsBuilder
            .fromHttpUrl("https://${appProperties.oauth2ClientUrl}")
            .path("/authorize")
            .queryParam("response_type", "code")
            .queryParam("client_id", appProperties.oauth2ClientId)
            .queryParam("state", oAuth2Generator.code())
            .queryParam("scope", "openid+profile+email+read:dataset")
            .queryParam("audience", appProperties.oauth2ClientAudience)
            .queryParam("redirect_uri", "${appProperties.applicationUrl}/callback/oauth2Client")
            .build()

        val httpHeader = HttpHeaders()
        httpHeader.location = URI(url.toUriString())
        return ResponseEntity(httpHeader, HttpStatus.SEE_OTHER)
    }
}
