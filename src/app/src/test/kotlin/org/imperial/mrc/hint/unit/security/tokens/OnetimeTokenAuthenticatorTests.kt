package org.imperial.mrc.hint.unit.security.tokens

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.tokens.KeyHelper
import org.imperial.mrc.hint.security.tokens.OneTimeTokenAuthenticator
import org.imperial.mrc.hint.security.tokens.OneTimeTokenChecker
import org.imperial.mrc.hint.security.tokens.TokenType
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.pac4j.jwt.config.signature.RSASignatureConfiguration
import org.pac4j.jwt.profile.JwtGenerator
import java.security.KeyPair
import java.time.Duration
import java.time.Instant
import java.util.*

class OnetimeTokenAuthenticatorTests{

    private val keyPair: KeyPair = KeyHelper.keyPair
    private val signatureConfiguration = RSASignatureConfiguration(keyPair)
    private val tokenGenerator = JwtGenerator<CommonProfile>(signatureConfiguration)

    private val okTokenChecker = mock<OneTimeTokenChecker> {
        on { checkToken(any()) } doReturn true
    }

    @Test
    fun `can get claims when token is valid`() {
        val token= tokenGenerator.generate(mapOf(
                "iss" to "right issuer",
                "token_type" to TokenType.ONETIME,
                "sub" to "test user",
                "exp" to Date.from(Instant.now().plus(Duration.ofDays(1))),
                "url" to "/password/set/"
        ))

        val sut = OneTimeTokenAuthenticator(signatureConfiguration, okTokenChecker, "right issuer")

        val profile = sut.validateToken(token)
        assertThat(profile).isNotNull()

        val claims = sut.validateTokenAndGetClaims(token)
        assertThat(claims.count()).isEqualTo(5)
    }

    @Test
    fun `validateToken returns null when issuer is incorrect`() {
        val token= tokenGenerator.generate(mapOf(
                "iss" to "wrong issuer",
                "token_type" to TokenType.ONETIME,
                "sub" to "test user",
                "exp" to Date.from(Instant.now().plus(Duration.ofDays(1))),
                "url" to "/password/set/"
        ))

        val sut = OneTimeTokenAuthenticator(signatureConfiguration, okTokenChecker, "right issuer")

        val profile = sut.validateToken(token)
        assertThat(profile).isNull()
    }

    @Test
    fun `validateToken returns null when token type is incorrect`() {
        val token= tokenGenerator.generate(mapOf(
                "iss" to "right issuer",
                "token_type" to "wrong token type",
                "sub" to "test user",
                "exp" to Date.from(Instant.now().plus(Duration.ofDays(1))),
                "url" to "/password/set/"
        ))

        val sut = OneTimeTokenAuthenticator(signatureConfiguration, okTokenChecker, "right issuer")

        val profile = sut.validateToken(token)
        assertThat(profile).isNull()
    }

    @Test
    fun `validateToken returns null when no url claim`() {
        val token= tokenGenerator.generate(mapOf(
                "iss" to "right issuer",
                "token_type" to TokenType.ONETIME,
                "sub" to "test user",
                "exp" to Date.from(Instant.now().plus(Duration.ofDays(1)))
        ))

        val sut = OneTimeTokenAuthenticator(signatureConfiguration, okTokenChecker, "right issuer")

        val profile = sut.validateToken(token)
        assertThat(profile).isNull()
    }

    @Test
    fun `validateToken returns null when token check fails`() {
        val token= tokenGenerator.generate(mapOf(
                "iss" to "right issuer",
                "token_type" to TokenType.ONETIME,
                "sub" to "test user",
                "exp" to Date.from(Instant.now().plus(Duration.ofDays(1))),
                "url" to "/password/set/"
        ))

        val mockTokenChecker =  mock<OneTimeTokenChecker> {
            on { checkToken(any()) } doReturn false
        }

        val sut = OneTimeTokenAuthenticator(signatureConfiguration, mockTokenChecker, "right issuer")

        val profile = sut.validateToken(token)
        assertThat(profile).isNull()
    }
}