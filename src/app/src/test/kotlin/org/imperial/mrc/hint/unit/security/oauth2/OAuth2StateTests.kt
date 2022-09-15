package org.imperial.mrc.hint.unit.security.oauth2

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.imperial.mrc.hint.security.oauth2.OAuth2State
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class OAuth2StateTests
{
    @Test
    fun `can generate code`()
    {
        val mockCode = mock<OAuth2State> {
            on { generateCode() } doReturn "generated123"
        }
        assertEquals(mockCode.generateCode(), "generated123")
    }
}