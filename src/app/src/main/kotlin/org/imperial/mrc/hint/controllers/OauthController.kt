package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.OAuth2FuelClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class OauthController(private val oAuth2FuelClient: OAuth2FuelClient)
{
    @GetMapping("/oauth2")
    fun oauth(): ResponseEntity<String> {

        println(oAuth2FuelClient.get("/dataset"))
        return oAuth2FuelClient.get("/dataset")
    }
}
