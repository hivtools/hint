package org.imperial.mrc.hint.db

import org.jooq.DSLContext
import org.imperial.mrc.hint.db.Tables.VERSION
import org.imperial.mrc.hint.db.Tables.VERSION_SNAPSHOT
import org.imperial.mrc.hint.models.Snapshot
import org.imperial.mrc.hint.models.Version
import org.springframework.stereotype.Component

interface VersionRepository
{
    fun saveNewVersion(userId: String, versionName: String): Int
    fun getVersions(userId: String): List<Version>
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

    override fun getVersions(userId: String): List<Version> {
        val result =
                dsl.select(
                        VERSION.ID,
                        VERSION.NAME,
                        VERSION_SNAPSHOT.ID,
                        VERSION_SNAPSHOT.CREATED,
                        VERSION_SNAPSHOT.UPDATED)
                        .from(VERSION)
                        .join(VERSION_SNAPSHOT)
                        .on(VERSION.ID.eq(VERSION_SNAPSHOT.VERSION_ID))
                        .where(VERSION.USER_ID.eq(userId))
                        .and(VERSION_SNAPSHOT.DELETED.eq(false))
                        .fetch()

        return result.groupBy{it[VERSION.ID]}
            .map{v -> Version(v.key, v.value[0][VERSION.NAME],
                    v.value.map{s -> Snapshot(s[VERSION_SNAPSHOT.ID],
                            s[VERSION_SNAPSHOT.CREATED], s[VERSION_SNAPSHOT.UPDATED])})}


    }
}
