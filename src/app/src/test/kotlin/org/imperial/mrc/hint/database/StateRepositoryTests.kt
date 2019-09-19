package org.imperial.mrc.hint.database

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.StateRepository
import org.imperial.mrc.hint.db.Tables.SESSION_FILE
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.db.tables.UserSession.USER_SESSION
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@Transactional
class StateRepositoryTests {

    @Autowired
    private lateinit var sut: StateRepository

    @Autowired
    private lateinit var userRepo: UserRepository

    @Autowired
    private lateinit var dsl: DSLContext

    @Test
    fun `can save session`() {
        userRepo.addUser("email", "pw")
        val uid = userRepo.getUser("email")!!.id
        sut.saveSession("sid", uid)

        val session = dsl.selectFrom(USER_SESSION)
                .fetchOne()

        assertThat(session[USER_SESSION.USER_ID]).isEqualTo(uid)
        assertThat(session[USER_SESSION.SESSION]).isEqualTo("sid")
    }

    @Test
    fun `saveNewHash returns true if a new hash is saved`() {
        val result = sut.saveNewHash("newhash")
        assertThat(result).isTrue()
    }

    @Test
    fun `saveNewHash returns false if the hash already exists`() {
        sut.saveNewHash("newhash")
        val result = sut.saveNewHash("newhash")
        assertThat(result).isFalse()
    }

    @Test
    fun `saves new session file`() {
        setUpSessionAndHash()
        sut.saveSessionFile("sid", FileType.PJNZ, "newhash", "original.pjnz")

        val record = dsl.selectFrom(SESSION_FILE)
                .fetchOne()

        assertThat(record[SESSION_FILE.FILENAME]).isEqualTo("original.pjnz")
        assertThat(record[SESSION_FILE.HASH]).isEqualTo("newhash")
        assertThat(record[SESSION_FILE.SESSION]).isEqualTo("sid")
        assertThat(record[SESSION_FILE.TYPE]).isEqualTo("pjnz")
    }

    @Test
    fun `updates session file if an entry for the given type already exists`() {
        setUpSessionAndHash()
        sut.saveSessionFile("sid", FileType.PJNZ, "newhash", "original.pjnz")

        sut.saveNewHash("anotherhash")
        sut.saveSessionFile("sid", FileType.PJNZ, "anotherhash", "anotherfilename.pjnz")

        val records = dsl.selectFrom(SESSION_FILE)
                .fetch()

        assertThat(records.count()).isEqualTo(1)
        assertThat(records[0][SESSION_FILE.FILENAME]).isEqualTo("anotherfilename.pjnz")
        assertThat(records[0][SESSION_FILE.HASH]).isEqualTo("anotherhash")
        assertThat(records[0][SESSION_FILE.SESSION]).isEqualTo("sid")
        assertThat(records[0][SESSION_FILE.TYPE]).isEqualTo("pjnz")
    }

    @Test
    fun `can get session file hash`() {
        setUpSessionAndHash()
        sut.saveSessionFile("sid", FileType.PJNZ, "newhash", "original.pjnz")
        val result = sut.getSessionFileHash("sid", FileType.PJNZ)
        assertThat(result).isEqualTo("newhash")
    }

    private fun setUpSessionAndHash() {
        sut.saveNewHash("newhash")
        userRepo.addUser("email", "pw")
        val uid = userRepo.getUser("email")!!.id
        sut.saveSession("sid", uid)
    }
}