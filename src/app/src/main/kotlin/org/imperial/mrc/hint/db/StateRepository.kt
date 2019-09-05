package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables.SESSION_FILES
import org.imperial.mrc.hint.db.Tables.USER_SESSION
import org.imperial.mrc.hint.db.tables.records.SessionFilesRecord
import org.imperial.mrc.hint.security.Session
import org.jooq.DSLContext
import org.jooq.TableField
import org.springframework.stereotype.Component

interface StateRepository {
    fun saveSession()
    fun saveHash(type: FileType, hash: String)
    fun getHash(type: FileType): String?
}

@Component
class JooqStateRepository(private val dsl: DSLContext,
                          private val session: Session) : StateRepository {

    override fun saveSession() {
        val sessionId = session.getId()
        val userId = session.getUserProfile().id
        val userSession = dsl.selectFrom(USER_SESSION)
                .where(USER_SESSION.SESSION.eq(session.getId()))
                .firstOrNull()

        if (userSession == null) {
            dsl.insertInto(USER_SESSION)
                    .set(USER_SESSION.USER_ID, userId)
                    .set(USER_SESSION.SESSION, sessionId)
                    .execute()

            dsl.insertInto(SESSION_FILES)
                    .set(SESSION_FILES.SESSION, sessionId)
                    .execute()
        }
    }

    override fun saveHash(type: FileType, hash: String) {
        dsl.update(SESSION_FILES)
                .set(getField(type), hash)
                .execute()
    }

    override fun getHash(type: FileType): String? {

        val sessionId = session.getId()
        return dsl.select(getField(type))
                .from(SESSION_FILES)
                .where(SESSION_FILES.SESSION.eq(sessionId))
                .fetchAny()?.into(String::class.java)
    }

    private fun getField(fileType: FileType): TableField<SessionFilesRecord, String> {
        return when (fileType) {
            FileType.ANC -> SESSION_FILES.ANC
            FileType.PJNZ -> SESSION_FILES.PJNZ
            FileType.Program -> SESSION_FILES.PROGRAMME
            FileType.Shape -> SESSION_FILES.SHAPE
            FileType.Survey -> SESSION_FILES.SURVEY
        }
    }

}