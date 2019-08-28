package org.imperial.mrc.hint.security.tokens

import org.imperial.mrc.hint.db.TokenRepository
import org.springframework.context.annotation.Configuration

interface OneTimeTokenChecker
{
    /** Returns true if the token exists and removes it before returning.
     * This ensures tokens can only be used once. No other checks are
     * performed. **/
    fun checkToken(uncompressedToken: String): Boolean
}

@Configuration
open class JooqOneTimeTokenChecker(private val tokenRepository: TokenRepository) : OneTimeTokenChecker
{
    override fun checkToken(token: String): Boolean
    {
        return tokenRepository.validateOneTimeToken(token)
    }
}