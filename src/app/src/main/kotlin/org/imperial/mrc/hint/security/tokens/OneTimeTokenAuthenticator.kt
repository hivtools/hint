package org.imperial.mrc.hint.security.tokens

import com.nimbusds.jwt.JWT
import org.imperial.mrc.hint.AppProperties
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.credentials.TokenCredentials
import org.pac4j.core.exception.CredentialsException
import org.pac4j.jwt.config.signature.SignatureConfiguration
import org.pac4j.jwt.credentials.authenticator.JwtAuthenticator
import org.springframework.context.annotation.Configuration

@Configuration
class OneTimeTokenAuthenticator(
        signatureConfiguration: SignatureConfiguration,
        private val oneTimeTokenChecker: OneTimeTokenChecker,
        appProperties: AppProperties
) : JwtAuthenticator(signatureConfiguration)
{

    private val tokenIssuer = appProperties.tokenIssuer

    override fun createJwtProfile(
        credentials: TokenCredentials?,
        jwt: JWT?,
        context: WebContext?,
        sessionStore: SessionStore?
    )
    {
        super.createJwtProfile(credentials, jwt, context, sessionStore)
        val claims = jwt?.jwtClaimsSet
        val issuer = claims?.issuer
        if (issuer != tokenIssuer)
        {
            throw CredentialsException("Token was issued by '$issuer'. Must be issued by '${tokenIssuer}'")
        }

        credentials?.let { checkTokenAgainstRepository(it) }
    }

    private fun checkTokenAgainstRepository(credentials: TokenCredentials)
    {
        val compressedToken = credentials.token
        if (!oneTimeTokenChecker.checkToken(compressedToken))
        {
            throw CredentialsException("Token has already been used (or never existed)")
        }
    }

}
