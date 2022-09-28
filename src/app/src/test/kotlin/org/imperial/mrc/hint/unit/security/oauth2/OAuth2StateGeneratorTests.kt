package org.imperial.mrc.hint.unit.security.oauth2

import org.imperial.mrc.hint.security.oauth2.OAuth2StateGenerator
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class OAuth2StateGeneratorTests
{
    @Test
    fun `can decode state`()
    {
        val encoded = OAuth2StateGenerator.encodedState()

        assertTrue(OAuth2StateGenerator.decodedState(encoded).isNotEmpty())
    }
}
