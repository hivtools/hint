package org.imperial.mrc.hint.unit.security.oauth2

import org.imperial.mrc.hint.security.oauth2.OAuth2State
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class OAuth2StateTests
{
    @Test
    fun `UUID can generate code`()
    {
        val sut = OAuth2State()

        assertTrue(sut.generateCode().isNotEmpty())
    }
}