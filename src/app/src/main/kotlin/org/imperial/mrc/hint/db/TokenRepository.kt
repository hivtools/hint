package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.db.Tables.ONETIME_TOKEN
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component
import javax.sql.DataSource

interface TokenRepository
{
    fun storeToken(uncompressedToken: String)
}

@Component
class JooqTokenRepository(private val dataSource: DataSource): TokenRepository
{
    override fun storeToken(uncompressedToken: String) {
        JooqContext(dataSource).use {
            val r = it.dsl.newRecord(ONETIME_TOKEN)
            r.token = uncompressedToken
            r.store()
        }
    }
}