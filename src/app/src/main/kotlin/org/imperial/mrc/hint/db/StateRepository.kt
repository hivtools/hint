package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables.*
import org.imperial.mrc.hint.models.SessionFile
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.Record1
import org.jooq.Result
import org.springframework.stereotype.Component

interface StateRepository {
    fun saveSession(sessionId: String, userId: String)
    // returns true if a new hash is saved, false if it already exists
    fun saveNewHash(hash: String): Boolean
    fun saveSessionFile(sessionId: String, type: FileType, hash: String, fileName: String)
    fun getSessionFileHash(sessionId: String, type: FileType): String?
    fun getFilesForSession(sessionId: String): List<SessionFile>
}

@Component
class JooqStateRepository(private val dsl: DSLContext) : StateRepository {

    override fun saveSession(sessionId: String, userId: String) {

        val userSession = dsl.selectFrom(USER_SESSION)
                .where(USER_SESSION.SESSION.eq(sessionId))
                .firstOrNull()

        if (userSession == null) {
            dsl.insertInto(USER_SESSION)
                    .set(USER_SESSION.USER_ID, userId)
                    .set(USER_SESSION.SESSION, sessionId)
                    .execute()
        }
    }

    override fun saveNewHash(hash: String): Boolean {

        val record = dsl.selectFrom(FILE)
                .where(FILE.HASH.eq(hash))
                .firstOrNull()

        return if (record == null) {
            dsl.insertInto(FILE)
                    .set(FILE.HASH, hash)
                    .execute()
            true
        } else {
            false
        }
    }

    override fun saveSessionFile(sessionId: String, type: FileType, hash: String, fileName: String) {

        if (getSessionFileRecord(sessionId, type) == null) {
            dsl.insertInto(SESSION_FILE)
                    .set(SESSION_FILE.HASH, hash)
                    .set(SESSION_FILE.TYPE, type.toString())
                    .set(SESSION_FILE.SESSION, sessionId)
                    .set(SESSION_FILE.FILENAME, fileName)
                    .execute()
        } else {
            dsl.update(SESSION_FILE)
                    .set(SESSION_FILE.HASH, hash)
                    .set(SESSION_FILE.FILENAME, fileName)
                    .where(SESSION_FILE.SESSION.eq(sessionId))
                    .and(SESSION_FILE.TYPE.eq(type.toString()))
                    .execute()
        }

    }

    override fun getSessionFileHash(sessionId: String, type: FileType): String? {
        return getSessionFileRecord(sessionId, type)?.into(String::class.java)
    }


    override fun getFilesForSession(sessionId: String): List<SessionFile> {
        return dsl.select(SESSION_FILE.HASH, SESSION_FILE.TYPE)
                .from(SESSION_FILE)
                .where(SESSION_FILE.SESSION.eq(sessionId))
                .fetchInto(SessionFile::class.java)
    }

    private fun getSessionFileRecord(sessionId: String, type: FileType): Record? {
        return dsl.select(SESSION_FILE.HASH)
                .from(SESSION_FILE)
                .where(SESSION_FILE.SESSION.eq(sessionId))
                .and(SESSION_FILE.TYPE.eq(type.toString()))
                .fetchAny()
    }

}
