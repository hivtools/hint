package org.imperial.mrc.hint.security

import org.pac4j.core.context.WebContext
import org.pac4j.core.credentials.UsernamePasswordCredentials
import org.pac4j.core.credentials.password.PasswordEncoder
import org.pac4j.core.exception.BadCredentialsException
import org.pac4j.core.util.CommonHelper
import org.pac4j.sql.profile.service.DbProfileService
import javax.sql.DataSource

class HintDbProfileService(dataSource: DataSource, passwordEncoder: PasswordEncoder): DbProfileService(dataSource, passwordEncoder)
{
    override fun validate(credentials: UsernamePasswordCredentials, context: WebContext)
    {
        //The base class considers a blank username or password to be an error state, and throws a TechnicalException
        //rather than BadCredentialsException which is what we want - treat blank pw or username same as wrong pw or
        //username
        if (!CommonHelper.isBlank(credentials.username) && !CommonHelper.isBlank(credentials.password))
        {
            super.validate(credentials, context)
        }
        else
        {
            throw BadCredentialsException("Username and password must be provided")
        }
    }
}