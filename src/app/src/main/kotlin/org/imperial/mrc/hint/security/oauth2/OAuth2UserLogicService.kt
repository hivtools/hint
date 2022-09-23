package org.imperial.mrc.hint.security.oauth2

import org.imperial.mrc.hint.db.JooqUserRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logic.DbProfileServiceUserLogic
import org.jooq.DSLContext
import org.imperial.mrc.hint.caseInsensitiveEmail

interface OAuth2UserLogic
{
    fun validateUser(email: String): String
}

class OAuth2UserLogicService(
    dslContext: DSLContext,
) : JooqUserRepository(dslContext), OAuth2UserLogic
{
    override fun validateUser(email: String): String
    {
        if (!email.contains("@") && email != DbProfileServiceUserLogic.GUEST_USER)
        {
            throw UserException("invalidEmail")
        }

        return getAllUserNames()
            .find { caseInsensitiveEmail(email).matches(it) }
            ?: addAuth0User(email)
    }
}