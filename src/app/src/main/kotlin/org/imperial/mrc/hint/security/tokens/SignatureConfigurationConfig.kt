package org.imperial.mrc.hint.security.tokens

import org.pac4j.jwt.config.signature.SignatureConfiguration
import org.pac4j.jwt.config.signature.RSASignatureConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.security.KeyPair

@Configuration
open class SignatureConfigurationConfig
{
    @Bean
    open fun getSignatureConfiguation(): SignatureConfiguration
    {
        val keyPair: KeyPair = KeyHelper.keyPair
        return RSASignatureConfiguration(keyPair)
    }
}