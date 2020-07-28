package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.db.Tables.ADR_KEY
import org.jooq.DSLContext
import org.springframework.stereotype.Component

interface UserRepository {
    fun getAllUserNames(): List<String>
    fun saveADRKey(userId: String, encryptedKey: ByteArray)
    fun deleteADRKey(userId: String)
    fun getADRKey(userId: String): ByteArray?
}

@Component
class JooqUserRepository(private val dsl: DSLContext) : UserRepository {

    override fun getAllUserNames(): List<String> {
        return dsl.select(Tables.USERS.USERNAME)
                .from(Tables.USERS)
                .fetchInto(String::class.java)
    }

    override fun saveADRKey(userId: String, encryptedKey: ByteArray) {

        val existingKey = dsl.select(ADR_KEY.API_KEY)
                .from(ADR_KEY)
                .where(ADR_KEY.USER_ID.eq(userId))
                .fetch()

        if (existingKey.any()) {
            dsl.update(ADR_KEY)
                    .set(ADR_KEY.API_KEY, encryptedKey)
                    .where(ADR_KEY.USER_ID.eq(userId))
                    .execute()
        } else {
            dsl.insertInto(ADR_KEY)
                    .set(ADR_KEY.API_KEY, encryptedKey)
                    .set(ADR_KEY.USER_ID, userId)
                    .execute()
        }
    }

    override fun deleteADRKey(userId: String) {
        dsl.deleteFrom(ADR_KEY)
                .where(ADR_KEY.USER_ID.eq(userId))
                .execute()

    }

    override fun getADRKey(userId: String): ByteArray? {
        return dsl.select(ADR_KEY.API_KEY)
                .from(ADR_KEY)
                .where(ADR_KEY.USER_ID.eq(userId))
                .fetchAny()
                ?.get(ADR_KEY.API_KEY)
    }
}
