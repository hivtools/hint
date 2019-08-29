package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.db.Tables.ONETIME_TOKEN
import org.springframework.context.annotation.Configuration
import org.springframework.beans.factory.annotation.Autowired
import javax.sql.DataSource

interface TokenRepository
{
    fun storeToken(uncompressedToken: String)
}

@Configuration
class JooqTokenRepository(@Autowired private val dataSource: DataSource): TokenRepository
{
    override fun storeToken(uncompressedToken: String) {
        JooqContext(dataSource).use {
            val r = it.dsl.newRecord(ONETIME_TOKEN)
            r.token = uncompressedToken
            r.store()
        }
    }
}