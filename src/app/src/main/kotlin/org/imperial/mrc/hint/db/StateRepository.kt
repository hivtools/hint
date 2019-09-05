package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables.SESSION_FILES
import org.imperial.mrc.hint.db.Tables.USER_SESSION
import org.imperial.mrc.hint.security.SessionId
import org.jooq.DSLContext
import org.pac4j.core.profile.CommonProfile
import org.springframework.stereotype.Component

interface StateRepository {
    fun saveSession()
    fun saveFile(type: FileType, hash: String)
}

@Component
class JooqStateRepository(private val dsl: DSLContext,
                          private val sessionId: SessionId,
                          private val userProfile: CommonProfile) : StateRepository {

    override fun saveSession() {
        val r = dsl.newRecord(USER_SESSION)
        r.userId = userProfile.id
        r.session = sessionId
        r.store()

        val f = dsl.newRecord(SESSION_FILES)
        f.session = sessionId

    }

    override fun saveFile(type: FileType, hash: String) {

        dsl.select(SESSION_FILES)
        val r = dsl.newRecord(SESSION_FILES)
        r.session = sessionId

        when(type){
            FileType.PJNZ -> r.pjnz
        }
        r.file
        r.store()
    }


}