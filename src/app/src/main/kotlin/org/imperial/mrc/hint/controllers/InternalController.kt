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
 * version the request works on is not part of the identity: the browser sends it in X-Version-Id.
 */
@RestController
@RequestMapping("/internal")
class InternalController(private val session: Session)
{
    @GetMapping("/whoami")
    fun whoami(): ResponseEntity<Void>
    {
        return ResponseEntity.noContent()
                .header(USER_HEADER, session.getUserProfile().id)
                .build()
    }

    companion object
    {
        const val USER_HEADER = "X-Hint-User"
    }
}
