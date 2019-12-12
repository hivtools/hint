package org.imperial.mrc.hint.db

import org.jooq.DSLContext
import org.springframework.stereotype.Component

interface UserRepository {
    fun getAllUserNames(): List<String>
}

@Component
class JooqUserRepository(private val dsl: DSLContext) : UserRepository {

    override fun getAllUserNames(): List<String> {
        return dsl.select(Tables.USERS.USERNAME)
                .from(Tables.USERS)
                .fetchInto(String::class.java)
    }
}
