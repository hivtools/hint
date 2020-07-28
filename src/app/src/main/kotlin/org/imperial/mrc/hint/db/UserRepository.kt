package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.db.Tables.ADR_KEY
import org.jooq.DSLContext
import org.springframework.stereotype.Component

interface UserRepository {
    fun getAllUserNames(): List<String>
    fun getADRKey(userId: String): String?
}

@Component
class JooqUserRepository(private val dsl: DSLContext) : UserRepository {

    override fun getAllUserNames(): List<String> {
        return dsl.select(Tables.USERS.USERNAME)
                .from(Tables.USERS)
                .fetchInto(String::class.java)
    }

    override fun getADRKey(userId: String): String? {
        return dsl.select(ADR_KEY.API_KEY)
                .from(ADR_KEY)
                .where(ADR_KEY.USER_ID.eq(userId))
                .fetch()
                .singleOrNull()
                ?.into(String::class.java)
    }
}
