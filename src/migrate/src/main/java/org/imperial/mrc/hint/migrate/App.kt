package org.imperial.mrc.hint.migrate

import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.db.DbConfig
import org.imperial.mrc.hint.db.Tables.*
import org.jooq.SQLDialect
import org.jooq.impl.DSL

fun main(args: Array<String>) {
    val seen = mutableListOf<String>()
    DSL.using(DbConfig().dataSource(ConfiguredAppProperties()).connection, SQLDialect.POSTGRES).transaction { config ->
        val transaction = DSL.using(config)
        val ids = transaction.select(USERS.ID).from(USERS).fetch(USERS.ID)
        for (id in ids) {
            if (seen.contains(id.toLowerCase())) {
                continue
            }
            val allIDs = transaction.select(USERS.ID, DSL.count(PROJECT))
                    .from(USERS.leftJoin(PROJECT).on(USERS.ID.eq(PROJECT.USER_ID)))
                    .where(DSL.lower(USERS.ID).eq(id.toLowerCase()))
                    .groupBy(USERS.ID)
                    .orderBy(DSL.count(PROJECT).desc(), USERS.ID.asc())
                    .fetch()
            if (allIDs.size > 1) {
                val primaryID = allIDs[0][USERS.ID]
                allIDs.getValues(USERS.ID).drop(1).forEach { secondaryID ->
                    transaction.update(PROJECT)
                            .set(PROJECT.USER_ID, primaryID)
                            .where(PROJECT.USER_ID.eq(secondaryID))
                            .execute()
                    transaction.update(USER_SESSION)
                            .set(USER_SESSION.USER_ID, primaryID)
                            .where(USER_SESSION.USER_ID.eq(secondaryID))
                            .execute()
                    transaction.delete(USERS)
                            .where(USERS.ID.eq(secondaryID))
                            .execute()
                    println("$secondaryID -> $primaryID")
                }
            }
            seen.add(id.toLowerCase())
        }
    }
}
