package org.imperial.mrc.hint.security.tokens

import org.imperial.mrc.hint.AppProperties
import org.pac4j.core.profile.CommonProfile
import org.springframework.context.annotation.Configuration
import org.pac4j.jwt.config.signature.RSASignatureConfiguration
import org.pac4j.jwt.profile.JwtGenerator
import java.time.Duration
import java.security.KeyPair
import java.security.SecureRandom
import java.time.Instant
import java.util.*

enum class TokenType
{
    ONETIME
}

@Configuration
open class OneTimeTokenManager(
        appProperties: AppProperties
        //private val tokenRepository: TokenRepository
)
{
    private val keyPair: KeyPair = KeyHelper.keyPair
    private val signatureConfiguration = RSASignatureConfiguration(keyPair)
    private val generator = JwtGenerator<CommonProfile>(signatureConfiguration)
    private val issuer = appProperties.tokenIssuer
    private val random = SecureRandom()


    open fun generateOnetimeSetPasswordToken(user: CommonProfile): String
    {
        val token= generator.generate(mapOf(
                "iss" to issuer,
                "token_type" to TokenType.ONETIME,
                "sub" to user.username,
                "exp" to Date.from(Instant.now().plus(Duration.ofDays(1))),
                "url" to "/password/set/",
                "permissions" to "",
                "roles" to "",
                "nonce" to getNonce()
        ))

        //TODO!!
        //tokenRepository.storeToken(token)

        return token.deflated()
    }

    fun verifyOneTimeToken(compressedToken: String, oneTimeTokenChecker: OneTimeTokenChecker): Map<String, Any>
    {
        val authenticator = OneTimeTokenAuthenticator(signatureConfiguration, oneTimeTokenChecker, issuer)
        return authenticator.validateTokenAndGetClaims(compressedToken.inflated())
    }

    private fun getNonce(): String
    {
        val bytes = ByteArray(32)
        random.nextBytes(bytes)
        return Base64.getEncoder().encodeToString(bytes)
    }
}