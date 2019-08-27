package org.imperial.mrc.hint.unit.security.tokens

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.tokens.KeyHelper
import org.junit.jupiter.api.Test
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey

class KeyHelperTests
{
    @Test
    fun `can get KeyPair`()
    {
        val result = KeyHelper.keyPair
        assertThat(result.private).isInstanceOf(RSAPrivateKey::class.java)
        assertThat(result.public).isInstanceOf(RSAPublicKey::class.java)
    }
}