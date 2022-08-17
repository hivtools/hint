package org.imperial.mrc.hint.controllers

import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class OauthController
{
    @GetMapping("/oauth2/test")
    fun oauth(@AuthenticationPrincipal principal: OidcUser): ResponseEntity<String> {
        return ResponseEntity.ok("works! `${principal.userInfo}`")
    }
}