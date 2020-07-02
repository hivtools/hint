package org.imperial.mrc.hint.db

import org.jooq.DSLContext
import org.imperial.mrc.hint.db.Tables.VERSION
import org.springframework.stereotype.Component

interface VersionRepository
{
    fun saveNewVersion(userId: String, versionName: String): Int
}

@Component
class JooqVersionRepository(private val dsl: DSLContext) : VersionRepository {
    override fun saveNewVersion(userId: String, versionName: String): Int
    {
        val result = dsl.insertInto(VERSION, VERSION.USER_ID, VERSION.NAME)
                .values(userId, versionName)
                .returning(VERSION.ID)
                .fetchOne();

        return result[VERSION.ID]
    }
}
