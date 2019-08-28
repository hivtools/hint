package org.imperial.mrc.hint.unit.security.tokens

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.TokenRepository
import org.imperial.mrc.hint.security.tokens.KeyHelper
import org.imperial.mrc.hint.security.tokens.OneTimeTokenAuthenticator
import org.imperial.mrc.hint.security.tokens.OneTimeTokenChecker
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.pac4j.jwt.config.signature.RSASignatureConfiguration
import org.pac4j.jwt.config.signature.SignatureConfiguration
import java.time.Instant
import java.util.*

class OneTimeTokenManagerTests {

    @Test
    fun `can generate onetime set password token`()
    {
        val mockAppProperties = mock<AppProperties>(){
            on { tokenIssuer } doReturn "test issuer"
        }

        val mockUser = mock<CommonProfile> {
            on { username } doReturn "test user"
        }

        val mockTokenRepository = mock<TokenRepository>()

        val mockTokenChecker =  mock<OneTimeTokenChecker> {
            on { checkToken(any()) } doReturn true
        }

        val signatureConfig = RSASignatureConfiguration(KeyHelper.keyPair)
        val authenticator = OneTimeTokenAuthenticator(signatureConfig, mockTokenChecker, mockAppProperties)

        val sut = OneTimeTokenManager(mockAppProperties, mockTokenRepository, signatureConfig, authenticator)

        val token = sut.generateOnetimeSetPasswordToken(mockUser)

        val claims = sut.validateTokenAndGetClaims(token)
        assertThat(claims["iss"]).isEqualTo("test issuer")
        assertThat(claims["sub"]).isEqualTo("test user")
        assertThat(claims["exp"] as Date).isAfter(Date.from(Instant.now()))
        assertThat(claims["nonce"]).isNotNull()

        verify(mockTokenRepository).storeOneTimeToken(token)
    }
}