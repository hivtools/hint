package org.imperial.mrc.hint.security.oauth2

import org.springframework.stereotype.Component
import java.util.*

@Component
class OAuth2Generator
{
    /**
     * During implementation, code should be used to validate
     * OAuth2 redirect. Code should be encoded and stored in the state,
     * when a redirect is requested, code should be decoded and
     * compared against the stored code for validation. should
     * save guard against CSRF attacks.
     *
     */
    fun code(): String
    {
        return UUID.randomUUID().toString()
    }
}