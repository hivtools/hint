package org.imperial.mrc.hint.security.tokens

interface OneTimeTokenChecker
{
    /** Returns true if the token exists and removes it before returning.
     * This ensures tokens can only be used once. No other checks are
     * performed. **/
    fun checkToken(uncompressedToken: String): Boolean
}