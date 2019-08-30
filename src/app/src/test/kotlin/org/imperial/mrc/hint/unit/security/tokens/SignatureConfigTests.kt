package org.imperial.mrc.hint.unit.security.tokens

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.tokens.KeyHelper
import org.imperial.mrc.hint.security.tokens.SignatureConfig
import org.junit.jupiter.api.Test
import org.pac4j.jwt.config.signature.RSASignatureConfiguration

class SignatureConfigTests
{
    @Test
    fun `can get SignatureConfiguration`()
    {
        val result = SignatureConfig().getSignatureConfiguration()
        assertThat(result).isInstanceOf(RSASignatureConfiguration::class.java)
        assertThat((result as RSASignatureConfiguration).privateKey).isEqualTo(KeyHelper.keyPair.private)
        assertThat(result.publicKey).isEqualTo(KeyHelper.keyPair.public)
    }
}