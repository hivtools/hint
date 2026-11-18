package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Endpoints for the reverse proxy only, never for browsers. The proxy must not expose /internal/ publicly.
 *
 * While endpoints are migrated to the Python API, the proxy makes an auth_request to /internal/whoami for each request
 * it routes to Python, forwarding the browser's cookies. The user in the response header is passed on to Python. The
 * version the request works on is not part of the identity: the browser sends it in X-Version-Id. Python checks that
 * the user may use it, and for a guest that means knowing which versions this session was given, so those are passed
 * on too.
 *
 * For a single sign-on user the response also has their Auth0 access token, which Python needs to call ADR on their
 * behalf. The token is a credential: it only ever travels in this response header (never a body, never a log line) to
 * nginx, which hands it to Python and to nothing else (see proxy/snippets/python.conf).
 */
@RestController
@RequestMapping("/internal")
class InternalController(private val session: Session)
{
    @GetMapping("/whoami")
    fun whoami(): ResponseEntity<Void>
    {
        val response = ResponseEntity.noContent()
                .header(USER_HEADER, session.getUserProfile().id)
        val guestVersionIds = if (session.userIsGuest()) session.getGuestVersionIds() else listOf()
        if (guestVersionIds.isNotEmpty())
        {
            response.header(GUEST_VERSIONS_HEADER, guestVersionIds.joinToString(","))
        }
        val accessToken = session.getAccessToken()
        if (accessToken.isNotEmpty())
        {
            response.header(ACCESS_TOKEN_HEADER, accessToken)
        }
        return response.build()
    }

    companion object
    {
        const val USER_HEADER = "X-Hint-User"
        const val GUEST_VERSIONS_HEADER = "X-Hint-Guest-Versions"
        const val ACCESS_TOKEN_HEADER = "X-Hint-Access-Token"
    }
}
