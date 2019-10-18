package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThatThrownBy
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.db.Tables.SESSION_FILE
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.db.tables.UserSession.USER_SESSION
import org.imperial.mrc.hint.exceptions.SessionException
import org.imperial.mrc.hint.models.SessionFile
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@Transactional
class SessionRepositoryTests {

    @Autowired
    private lateinit var sut: SessionRepository

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
    fun `saveSession is idempotent`() {
        userRepo.addUser("email", "pw")
        val uid = userRepo.getUser("email")!!.id
        sut.saveSession("sid", uid)
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
        val result = sut.getSessionFile("sid", FileType.PJNZ)!!
        assertThat(result.hash).isEqualTo("newhash")
        assertThat(result.filename).isEqualTo("original.pjnz")
    }

    @Test
    fun `can set files for session`() {
        setUpSession()
        sut.saveNewHash("pjnz_hash")
        sut.saveNewHash("shape_hash")

        sut.setFilesForSession("sid", mapOf(
                "pjnz" to SessionFile("pjnz_hash", "pjnz_file"),
                "shape" to SessionFile("shape_hash", "shape_file"),
                "population" to null //should not attempt to save a null file
        ));

        val records = dsl.selectFrom(SESSION_FILE)
                .orderBy(SESSION_FILE.TYPE)
                .fetch();

        assertThat(records.count()).isEqualTo(2);

        assertThat(records[0][SESSION_FILE.FILENAME]).isEqualTo("pjnz_file")
        assertThat(records[0][SESSION_FILE.HASH]).isEqualTo("pjnz_hash")
        assertThat(records[0][SESSION_FILE.SESSION]).isEqualTo("sid")
        assertThat(records[0][SESSION_FILE.TYPE]).isEqualTo("pjnz")

        assertThat(records[1][SESSION_FILE.FILENAME]).isEqualTo("shape_file")
        assertThat(records[1][SESSION_FILE.HASH]).isEqualTo("shape_hash")
        assertThat(records[1][SESSION_FILE.SESSION]).isEqualTo("sid")
        assertThat(records[1][SESSION_FILE.TYPE]).isEqualTo("shape")
    }

    @Test
    fun `setFilesForSession deletes existing files for this session only`() {
        val uid = setUpSession()
        sut.saveSession("sid2", uid);

        sut.saveNewHash("shape_hash")
        setUpHashAndSessionFile("old_pjnz_hash", "old_pjnz", "sid", "pjnz")
        setUpHashAndSessionFile("other_shape_hash", "other_shape_file", "sid2", "shape")

        sut.setFilesForSession("sid", mapOf(
                "shape" to SessionFile("shape_hash", "shape_file")))

        val records = dsl.selectFrom(SESSION_FILE)
                .orderBy(SESSION_FILE.SESSION)
                .fetch();

        assertThat(records.count()).isEqualTo(2);

        assertThat(records[0][SESSION_FILE.FILENAME]).isEqualTo("shape_file")
        assertThat(records[0][SESSION_FILE.HASH]).isEqualTo("shape_hash")
        assertThat(records[0][SESSION_FILE.SESSION]).isEqualTo("sid")
        assertThat(records[0][SESSION_FILE.TYPE]).isEqualTo("shape")

        assertThat(records[1][SESSION_FILE.FILENAME]).isEqualTo("other_shape_file")
        assertThat(records[1][SESSION_FILE.HASH]).isEqualTo("other_shape_hash")
        assertThat(records[1][SESSION_FILE.SESSION]).isEqualTo("sid2")
        assertThat(records[1][SESSION_FILE.TYPE]).isEqualTo("shape")
    }

    @Test
    fun `setFilesForSession rolls back transaction on error, leaving existing session files unchanged`() {
        setUpSession()
        setUpHashAndSessionFile("pjnz_hash", "pjnz_file", "sid", "pjnz")

        assertThatThrownBy{ sut.setFilesForSession("sid", mapOf(
                "shape" to SessionFile("bad_hash", "bad_file"))) }
                .isInstanceOf(SessionException::class.java)
                .hasMessage("Unable to load files for session. Specified files do not exist on the server.")

        val records = dsl.selectFrom(SESSION_FILE)
                .orderBy(SESSION_FILE.SESSION)
                .fetch();

        assertThat(records.count()).isEqualTo(1);

        assertThat(records[0][SESSION_FILE.FILENAME]).isEqualTo("pjnz_file")
        assertThat(records[0][SESSION_FILE.HASH]).isEqualTo("pjnz_hash")
        assertThat(records[0][SESSION_FILE.SESSION]).isEqualTo("sid")
        assertThat(records[0][SESSION_FILE.TYPE]).isEqualTo("pjnz")

    }

    private fun setUpSessionAndHash(): String {
        sut.saveNewHash("newhash")
        return setUpSession();
    }

    private fun setUpSession(): String {
        userRepo.addUser("email", "pw")
        val uid = userRepo.getUser("email")!!.id
        sut.saveSession("sid", uid)

        return uid;
    }

    private fun setUpHashAndSessionFile(hash: String, filename: String, sessionId: String, type: String) {
        sut.saveNewHash(hash)
        dsl.insertInto(SESSION_FILE)
                .set(SESSION_FILE.FILENAME, filename)
                .set(SESSION_FILE.HASH, hash)
                .set(SESSION_FILE.SESSION, sessionId)
                .set(SESSION_FILE.TYPE, type)
                .execute()
    }
}