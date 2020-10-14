package org.imperial.mrc.hint.security.tokens

import org.pac4j.jwt.config.signature.RSASignatureConfiguration
import org.pac4j.jwt.config.signature.SignatureConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.security.KeyPair

@Configuration
class SignatureConfig
{
    @Bean
    fun getSignatureConfiguration(): SignatureConfiguration
    {
        val keyPair: KeyPair = KeyHelper.keyPair
        return RSASignatureConfiguration(keyPair)
    }
}
