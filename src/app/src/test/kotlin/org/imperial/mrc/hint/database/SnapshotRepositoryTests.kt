package org.imperial.mrc.hint.database

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.db.Tables.SNAPSHOT_FILE
import org.imperial.mrc.hint.db.Tables.VERSION_SNAPSHOT
import org.imperial.mrc.hint.exceptions.SnapshotException
import org.imperial.mrc.hint.helpers.TranslationAssert
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.SnapshotFile
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@Transactional
class SnapshotRepositoryTests {

    @Autowired
    private lateinit var sut: SnapshotRepository

    @Autowired
    private lateinit var dsl: DSLContext

    private val snapshotId = "sid"

    @Test
    fun `can save snapshot`() {
        sut.saveSnapshot(snapshotId, null)

        val snapshot = dsl.selectFrom(VERSION_SNAPSHOT)
                .fetchOne()

        assertThat(snapshot[VERSION_SNAPSHOT.ID]).isEqualTo(snapshotId)
    }

    @Test
    fun `saveSnapshot is idempotent`() {

        sut.saveSnapshot(snapshotId, null)
        sut.saveSnapshot(snapshotId, null)
        val snapshot = dsl.selectFrom(VERSION_SNAPSHOT)
                .fetchOne()

        assertThat(snapshot[VERSION_SNAPSHOT.ID]).isEqualTo(snapshotId)
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
    fun `saves new snapshot file`() {
        setUpSnapshotAndHash()
        sut.saveSnapshotFile(snapshotId, FileType.PJNZ, "newhash", "original.pjnz")

        val record = dsl.selectFrom(SNAPSHOT_FILE)
                .fetchOne()

        assertThat(record[SNAPSHOT_FILE.FILENAME]).isEqualTo("original.pjnz")
        assertThat(record[SNAPSHOT_FILE.HASH]).isEqualTo("newhash")
        assertThat(record[SNAPSHOT_FILE.SNAPSHOT]).isEqualTo(snapshotId)
        assertThat(record[SNAPSHOT_FILE.TYPE]).isEqualTo("pjnz")
    }

    @Test
    fun `correct snapshot file is removed`() {
        setUpSnapshotAndHash()
        val hash = "newhash"
        sut.saveSnapshotFile(snapshotId, FileType.PJNZ, hash, "original.pjnz")
        assertSnapshotFileExists(hash)

        // different file type
        sut.removeSnapshotFile(snapshotId, FileType.Survey)
        assertSnapshotFileExists(hash)

        // different snapshot
        sut.removeSnapshotFile("wrongid", FileType.PJNZ)
        assertSnapshotFileExists(hash)

        // correct details
        sut.removeSnapshotFile(snapshotId, FileType.PJNZ)
        val records = dsl.selectFrom(SNAPSHOT_FILE)
                .where(SNAPSHOT_FILE.HASH.eq(hash))

        assertThat(records.count()).isEqualTo(0)
    }

    @Test
    fun `updates snapshot file if an entry for the given type already exists`() {
        setUpSnapshotAndHash()
        sut.saveSnapshotFile(snapshotId, FileType.PJNZ, "newhash", "original.pjnz")

        sut.saveNewHash("anotherhash")
        sut.saveSnapshotFile(snapshotId, FileType.PJNZ, "anotherhash", "anotherfilename.pjnz")

        val records = dsl.selectFrom(SNAPSHOT_FILE)
                .fetch()

        assertThat(records.count()).isEqualTo(1)
        assertThat(records[0][SNAPSHOT_FILE.FILENAME]).isEqualTo("anotherfilename.pjnz")
        assertThat(records[0][SNAPSHOT_FILE.HASH]).isEqualTo("anotherhash")
        assertThat(records[0][SNAPSHOT_FILE.SNAPSHOT]).isEqualTo(snapshotId)
        assertThat(records[0][SNAPSHOT_FILE.TYPE]).isEqualTo("pjnz")
    }

    @Test
    fun `can get snapshot file hash`() {
        setUpSnapshotAndHash()
        sut.saveSnapshotFile(snapshotId, FileType.PJNZ, "newhash", "original.pjnz")
        val result = sut.getSnapshotFile(snapshotId, FileType.PJNZ)!!
        assertThat(result.hash).isEqualTo("newhash")
        assertThat(result.filename).isEqualTo("original.pjnz")
    }

    @Test
    fun `can get all snapshot file hashes`() {
        setUpSnapshotAndHash()
        sut.saveNewHash("pjnzhash")
        sut.saveNewHash("surveyhash")
        sut.saveSnapshotFile(snapshotId, FileType.PJNZ, "pjnzhash", "original.pjnz")
        sut.saveSnapshotFile(snapshotId, FileType.Survey, "surveyhash", "original.csv")
        val result = sut.getHashesForSnapshot(snapshotId)
        assertThat(result["survey"]).isEqualTo("surveyhash")
        assertThat(result["pjnz"]).isEqualTo("pjnzhash")
    }

    @Test
    fun `can get all snapshot files`() {
        setUpSnapshotAndHash()
        sut.saveNewHash("pjnzhash")
        sut.saveNewHash("surveyhash")
        sut.saveSnapshotFile(snapshotId, FileType.PJNZ, "pjnzhash", "original.pjnz")
        sut.saveSnapshotFile(snapshotId, FileType.Survey, "surveyhash", "original.csv")
        val result = sut.getSnapshotFiles(snapshotId)
        assertThat(result["survey"]!!.filename).isEqualTo("original.csv")
        assertThat(result["survey"]!!.hash).isEqualTo("surveyhash")
        assertThat(result["pjnz"]!!.filename).isEqualTo("original.pjnz")
        assertThat(result["pjnz"]!!.hash).isEqualTo("pjnzhash")
    }

    @Test
    fun `can set files for snapshot`() {
        setUpSnapshot()
        sut.saveNewHash("pjnz_hash")
        sut.saveNewHash("shape_hash")

        sut.setFilesForSnapshot(snapshotId, mapOf(
                "pjnz" to SnapshotFile("pjnz_hash", "pjnz_file"),
                "shape" to SnapshotFile("shape_hash", "shape_file"),
                "population" to null //should not attempt to save a null file
        ));

        val records = dsl.selectFrom(SNAPSHOT_FILE)
                .orderBy(SNAPSHOT_FILE.TYPE)
                .fetch()

        assertThat(records.count()).isEqualTo(2);

        assertThat(records[0][SNAPSHOT_FILE.FILENAME]).isEqualTo("pjnz_file")
        assertThat(records[0][SNAPSHOT_FILE.HASH]).isEqualTo("pjnz_hash")
        assertThat(records[0][SNAPSHOT_FILE.SNAPSHOT]).isEqualTo(snapshotId)
        assertThat(records[0][SNAPSHOT_FILE.TYPE]).isEqualTo("pjnz")

        assertThat(records[1][SNAPSHOT_FILE.FILENAME]).isEqualTo("shape_file")
        assertThat(records[1][SNAPSHOT_FILE.HASH]).isEqualTo("shape_hash")
        assertThat(records[1][SNAPSHOT_FILE.SNAPSHOT]).isEqualTo(snapshotId)
        assertThat(records[1][SNAPSHOT_FILE.TYPE]).isEqualTo("shape")
    }

    @Test
    fun `setFilesForSnapshot deletes existing files for this snapshot only`() {
        sut.saveSnapshot("sid2", null);

        sut.saveNewHash("shape_hash")
        setUpHashAndSnapshotFile("old_pjnz_hash", "old_pjnz", snapshotId, "pjnz")
        setUpHashAndSnapshotFile("other_shape_hash", "other_shape_file", "sid2", "shape")

        sut.setFilesForSnapshot(snapshotId, mapOf(
                "shape" to SnapshotFile("shape_hash", "shape_file")))

        val records = dsl.selectFrom(SNAPSHOT_FILE)
                .orderBy(SNAPSHOT_FILE.SNAPSHOT)
                .fetch()

        assertThat(records.count()).isEqualTo(2)

        assertThat(records[0][SNAPSHOT_FILE.FILENAME]).isEqualTo("shape_file")
        assertThat(records[0][SNAPSHOT_FILE.HASH]).isEqualTo("shape_hash")
        assertThat(records[0][SNAPSHOT_FILE.SNAPSHOT]).isEqualTo(snapshotId)
        assertThat(records[0][SNAPSHOT_FILE.TYPE]).isEqualTo("shape")

        assertThat(records[1][SNAPSHOT_FILE.FILENAME]).isEqualTo("other_shape_file")
        assertThat(records[1][SNAPSHOT_FILE.HASH]).isEqualTo("other_shape_hash")
        assertThat(records[1][SNAPSHOT_FILE.SNAPSHOT]).isEqualTo("sid2")
        assertThat(records[1][SNAPSHOT_FILE.TYPE]).isEqualTo("shape")
    }

    @Test
    fun `setFilesForSession rolls back transaction on error, leaving existing session files unchanged`() {
        setUpSnapshot()
        setUpHashAndSnapshotFile("pjnz_hash", "pjnz_file", snapshotId, "pjnz")

        TranslationAssert.assertThatThrownBy {
            sut.setFilesForSnapshot(snapshotId, mapOf(
                    "shape" to SnapshotFile("bad_hash", "bad_file")))
        }
                .isInstanceOf(SnapshotException::class.java)
                .hasTranslatedMessage("Unable to load files for session. Specified files do not exist on the server.")

        val records = dsl.selectFrom(SNAPSHOT_FILE)
                .orderBy(SNAPSHOT_FILE.SNAPSHOT)
                .fetch();

        assertThat(records.count()).isEqualTo(1);

        assertThat(records[0][SNAPSHOT_FILE.FILENAME]).isEqualTo("pjnz_file")
        assertThat(records[0][SNAPSHOT_FILE.HASH]).isEqualTo("pjnz_hash")
        assertThat(records[0][SNAPSHOT_FILE.SNAPSHOT]).isEqualTo(snapshotId)
        assertThat(records[0][SNAPSHOT_FILE.TYPE]).isEqualTo("pjnz")

    }

    private fun assertSnapshotFileExists(hash: String) {
        val records = dsl.selectFrom(SNAPSHOT_FILE)
                .where(SNAPSHOT_FILE.HASH.eq(hash))

        assertThat(records.count()).isEqualTo(1)
    }

    private fun setUpSnapshotAndHash() {
        sut.saveNewHash("newhash")
        setUpSnapshot()
    }

    private fun setUpSnapshot() {
        sut.saveSnapshot(snapshotId,null)
    }

    private fun setUpHashAndSnapshotFile(hash: String, filename: String, snapshotId: String, type: String) {
        sut.saveNewHash(hash)
        setUpSnapshot()
        dsl.insertInto(SNAPSHOT_FILE)
                .set(SNAPSHOT_FILE.FILENAME, filename)
                .set(SNAPSHOT_FILE.HASH, hash)
                .set(SNAPSHOT_FILE.SNAPSHOT, snapshotId)
                .set(SNAPSHOT_FILE.TYPE, type)
                .execute()
    }

}
