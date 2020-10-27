package org.imperial.mrc.hint.security

import org.pac4j.core.credentials.password.JBCryptPasswordEncoder
import org.pac4j.core.credentials.password.PasswordEncoder

class SecurePasswordEncoder : PasswordEncoder
{

    override fun matches(plainPassword: String, encodedPassword: String): Boolean
    {
        // the salt for this password is contained within the encoded password
        // so it doesn't matter what salt the JBCryptPasswordEncoder is initialised with
        return JBCryptPasswordEncoder().matches(plainPassword, encodedPassword)
    }

    override fun encode(password: String): String
    {
        // a new instance of the JBCryptPasswordEncoder ensures a new randomly generated salt
        // for this password
        return JBCryptPasswordEncoder().encode(password)
    }

}
