package org.imperial.mrc.hint.security.oauth2

import java.util.*

object OAuth2StateGenerator
{
    private val randomString = UUID.randomUUID().toString()

    fun plaintextState(): String
    {
        return randomString
    }

    fun encodedState(): String
    {
        return Base64.getEncoder().encodeToString(randomString.toByteArray())
    }

    fun decodedState(code: String): String
    {
        return Base64.getDecoder().decode(code).decodeToString()
    }
}
