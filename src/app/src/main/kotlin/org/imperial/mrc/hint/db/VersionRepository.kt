package org.imperial.mrc.hint.db

import org.jooq.DSLContext
import org.imperial.mrc.hint.db.Tables.PROJECT
import org.imperial.mrc.hint.db.Tables.PROJECT_VERSION
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
        val result = dsl.insertInto(PROJECT, PROJECT.USER_ID, PROJECT.NAME)
                .values(userId, versionName)
                .returning(PROJECT.ID)
                .fetchOne();

        return result[PROJECT.ID]
    }

    override fun getVersions(userId: String): List<Version> {
        val result =
                dsl.select(
                        PROJECT.ID,
                        PROJECT.NAME,
                        PROJECT_VERSION.ID,
                        PROJECT_VERSION.CREATED,
                        PROJECT_VERSION.UPDATED)
                        .from(PROJECT)
                        .join(PROJECT_VERSION)
                        .on(PROJECT.ID.eq(PROJECT_VERSION.PROJECT_ID))
                        .where(PROJECT.USER_ID.eq(userId))
                        .and(PROJECT_VERSION.DELETED.eq(false))
                        .orderBy(PROJECT_VERSION.UPDATED.desc())
                        .fetch()

        return result.groupBy { it[PROJECT.ID] }
                .map { v ->
                    Version(v.key, v.value[0][PROJECT.NAME],
                            v.value.map { s ->
                                Snapshot(s[PROJECT_VERSION.ID], s[PROJECT_VERSION.CREATED],
                                        s[PROJECT_VERSION.UPDATED])
                            })
                }
                .sortedByDescending { it.snapshots[0].updated }
    }
}
