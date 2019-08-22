package org.imperial.mrc.hint.security.tokens

import com.nimbusds.jwt.JWT
import org.pac4j.core.credentials.TokenCredentials
import org.pac4j.core.exception.CredentialsException
import org.pac4j.jwt.config.signature.SignatureConfiguration
import org.pac4j.jwt.credentials.authenticator.JwtAuthenticator

class OneTimeTokenAuthenticator(
        signatureConfiguration: SignatureConfiguration,
        private val oneTimeTokenChecker: OneTimeTokenChecker,
        private val tokenIssuer: String
) : JwtAuthenticator(signatureConfiguration)
{

    override fun createJwtProfile(credentials: TokenCredentials, jwt: JWT)
    {
        super.createJwtProfile(credentials, jwt)
        val claims = jwt.jwtClaimsSet
        val issuer = claims.issuer
        if (issuer != tokenIssuer)
        {
            throw CredentialsException("Token was issued by '$issuer'. Must be issued by '${tokenIssuer}'")
        }
        val tokenType = claims.getClaim("token_type").toString()
        if (tokenType != TokenType.ONETIME.toString())
        {
            throw CredentialsException("Wrong type of token was provided. " +
                    "Expected '${TokenType.ONETIME}', was actually '$tokenType'")
        }
        handleUrlAttribute(credentials, jwt)
        checkTokenAgainstRepository(credentials)
    }

    private fun checkTokenAgainstRepository(credentials: TokenCredentials)
    {
        val compressedToken = credentials.token
        if (!oneTimeTokenChecker.checkToken(compressedToken.inflated()))
        {
            throw CredentialsException("Token has already been used (or never existed)")
        }
    }

    private fun handleUrlAttribute(credentials: TokenCredentials, jwt: JWT)
    {
        val claims = jwt.jwtClaimsSet
        val url = claims.getClaim("url")
        if (url !is String || url.isEmpty())
        {
            throw CredentialsException("No 'url' claim provided. Token is invalid")
        }
    }
}
