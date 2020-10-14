package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.db.Tables.ONETIME_TOKEN
import org.jooq.DSLContext
import org.springframework.stereotype.Component

interface TokenRepository
{
    fun storeOneTimeToken(token: String)
    fun validateOneTimeToken(token: String): Boolean
}

@Component
class JooqTokenRepository(private val dsl: DSLContext) : TokenRepository
{
    override fun storeOneTimeToken(token: String)
    {
        val r = dsl.newRecord(ONETIME_TOKEN)
        r.token = token
        r.store()
    }

    override fun validateOneTimeToken(token: String): Boolean
    {

        val deletedCount = dsl.deleteFrom(ONETIME_TOKEN)
                .where(ONETIME_TOKEN.TOKEN.eq(token))
                .execute()
        return deletedCount > 0

    }
}
