package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.db.Tables.ONETIME_TOKEN
import org.springframework.context.annotation.Configuration
import org.springframework.beans.factory.annotation.Autowired
import javax.sql.DataSource

interface TokenRepository
{
    fun storeOneTimeToken(token: String)
    fun validateOneTimeToken(token: String): Boolean
}

@Configuration
open class JooqTokenRepository(@Autowired private val dataSource: DataSource): TokenRepository
{
    override fun storeOneTimeToken(token: String) {
        JooqContext(dataSource).use {
            val r = it.dsl.newRecord(ONETIME_TOKEN)
            r.token = token
            r.store()
        }
    }

    override fun validateOneTimeToken(token: String): Boolean {
        JooqContext(dataSource).use {
            val deletedCount = it.dsl.deleteFrom(ONETIME_TOKEN)
                    .where(ONETIME_TOKEN.TOKEN.eq(token))
                    .execute()
            return deletedCount > 0
        }
    }
}