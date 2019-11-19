package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables.*
import org.imperial.mrc.hint.exceptions.SessionException
import org.imperial.mrc.hint.models.SessionFile
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.impl.DSL
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Component

interface SessionRepository {
    fun saveSession(sessionId: String, userId: String)
    // returns true if a new hash is saved, false if it already exists
    fun saveNewHash(hash: String): Boolean

    fun saveSessionFile(sessionId: String, type: FileType, hash: String, fileName: String)
    fun removeSessionFile(sessionId: String, type: FileType)
    fun getSessionFile(sessionId: String, type: FileType): SessionFile?
    fun getHashesForSession(sessionId: String): Map<String, String>
    fun getSessionFiles(sessionId: String): Map<String, SessionFile>
    fun setFilesForSession(sessionId: String, files: Map<String, SessionFile?>)
}

@Component
class JooqSessionRepository(private val dsl: DSLContext) : SessionRepository {

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

    override fun removeSessionFile(sessionId: String, type: FileType) {
        dsl.deleteFrom(SESSION_FILE)
                .where(SESSION_FILE.SESSION.eq(sessionId))
                .and(SESSION_FILE.TYPE.eq(type.toString()))
                .execute()
    }

    override fun getSessionFile(sessionId: String, type: FileType): SessionFile? {
        return getSessionFileRecord(sessionId, type)?.into(SessionFile::class.java)
    }

    override fun getHashesForSession(sessionId: String): Map<String, String> {
        return dsl.select(SESSION_FILE.HASH, SESSION_FILE.TYPE)
                .from(SESSION_FILE)
                .where(SESSION_FILE.SESSION.eq(sessionId))
                .associate { it[SESSION_FILE.TYPE] to it[SESSION_FILE.HASH] }
    }

    override fun getSessionFiles(sessionId: String): Map<String, SessionFile> {
        return dsl.select(SESSION_FILE.HASH, SESSION_FILE.FILENAME, SESSION_FILE.TYPE)
                .from(SESSION_FILE)
                .where(SESSION_FILE.SESSION.eq(sessionId))
                .associate { it[SESSION_FILE.TYPE] to SessionFile(it[SESSION_FILE.HASH], it[SESSION_FILE.FILENAME]) }
    }

    override fun setFilesForSession(sessionId: String, files: Map<String, SessionFile?>) {
        try {
            dsl.transaction { config ->
                val transaction = DSL.using(config)

                transaction.deleteFrom(SESSION_FILE)
                        .where(SESSION_FILE.SESSION.eq(sessionId))
                        .execute()

                files.forEach { (fileType, sessionFile) ->
                    if (sessionFile != null) {
                        transaction.insertInto(SESSION_FILE)
                                .set(SESSION_FILE.HASH, sessionFile.hash)
                                .set(SESSION_FILE.TYPE, fileType)
                                .set(SESSION_FILE.SESSION, sessionId)
                                .set(SESSION_FILE.FILENAME, sessionFile.filename)
                                .execute()
                    }
                }

            }
        } catch (e: DataIntegrityViolationException) {
            throw SessionException("Unable to load files for session. Specified files do not exist on the server.")
        }
    }

    private fun getSessionFileRecord(sessionId: String, type: FileType): Record? {
        return dsl.select(SESSION_FILE.HASH, SESSION_FILE.FILENAME)
                .from(SESSION_FILE)
                .where(SESSION_FILE.SESSION.eq(sessionId))
                .and(SESSION_FILE.TYPE.eq(type.toString()))
                .fetchAny()
    }

}
