package org.imperial.mrc.hint.database

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.Tables.PROJECT_VERSION
import org.imperial.mrc.hint.db.Tables.VERSION_FILE
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.VersionException
import org.imperial.mrc.hint.helpers.TranslationAssert
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.VersionFile
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@Transactional
class VersionRepositoryTests
{

    @Autowired
    private lateinit var sut: VersionRepository

    @Autowired
    private lateinit var projectRepo: ProjectRepository

    @Autowired
    private lateinit var userRepo: UserLogic

    @Autowired
    private lateinit var dsl: DSLContext

    private val versionId = "sid"
    private val testEmail = "test.user@test.com"

    @Test
    fun `can save version without project id`()
    {
        sut.saveVersion(versionId, null)

        val version = dsl.selectFrom(PROJECT_VERSION)
                .fetchOne()
        assertThat(version[PROJECT_VERSION.ID]).isEqualTo(versionId)
        assertThat(version[PROJECT_VERSION.VERSION_NUMBER]).isEqualTo(1)

        val projectId: Int? = version[PROJECT_VERSION.PROJECT_ID]
        assertThat(projectId).isEqualTo(null)
    }

    @Test
    fun `can save version with project id`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        sut.saveVersion(versionId, projectId)

        val version = dsl.selectFrom(PROJECT_VERSION)
                .fetchOne()

        assertThat(version[PROJECT_VERSION.ID]).isEqualTo(versionId)
        assertThat(version[PROJECT_VERSION.PROJECT_ID]).isEqualTo(projectId)
        assertThat(version[PROJECT_VERSION.VERSION_NUMBER]).isEqualTo(1)
    }

    @Test
    fun `saveVersion is idempotent`()
    {

        sut.saveVersion(versionId, null)
        sut.saveVersion(versionId, null)
        val version = dsl.selectFrom(PROJECT_VERSION)
                .fetchOne()

        assertThat(version[PROJECT_VERSION.ID]).isEqualTo(versionId)
        assertThat(version[PROJECT_VERSION.VERSION_NUMBER]).isEqualTo(1)
    }

    @Test
    fun `can save version state`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        sut.saveVersion(versionId, projectId)

        val anotherId = "another version id"
        sut.saveVersion(anotherId, projectId)

        val testState = "{\"state\": \"testState\"}";
        sut.saveVersionState(versionId, projectId, uid, testState)

        val savedVersion = dsl.select(PROJECT_VERSION.STATE)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .fetchOne()
        assertThat(savedVersion[PROJECT_VERSION.STATE]).isEqualTo(testState)

        val anotherVersion = dsl.select(PROJECT_VERSION.STATE)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(anotherId))
                .fetchOne()
        assertThat(anotherVersion[PROJECT_VERSION.STATE]).isEqualTo(null)
    }

    @Test
    fun `save version state throws error if version does not exist`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        assertThatThrownBy { sut.saveVersionState("nonexistentVersion", projectId, uid, "testState") }
                .isInstanceOf(VersionException::class.java)
                .hasMessageContaining("versionDoesNotExist")
    }

    @Test
    fun `save version state throws error if version belongs to another project`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        assertThatThrownBy { sut.saveVersionState(versionId, projectId + 1, uid, "testState") }
                .isInstanceOf(VersionException::class.java)
                .hasMessageContaining("versionDoesNotExist")
    }

    @Test
    fun `save version state throws error if version belongs to another user`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        assertThatThrownBy { sut.saveVersionState(versionId, projectId, "not$uid", "testState") }
                .isInstanceOf(VersionException::class.java)
                .hasMessageContaining("versionDoesNotExist")
    }

    @Test
    fun `can copy version`()
    {
        val now = LocalDateTime.now(ZoneOffset.UTC)
        val soon = now.plusSeconds(5)

        val uid = setupUser()
        val projectId = setupProject(uid)
        sut.saveVersion(versionId, projectId)
        setUpHashAndVersionFile("pjnz_hash", "pjnz_file", versionId, "pjnz", false)
        setUpHashAndVersionFile("survey_hash", "survey_file", versionId, "survey", false)
        sut.saveVersionState(versionId, projectId, uid, "TEST STATE")

        sut.copyVersion(versionId, "newVersionId", projectId, uid)

        val newVersion = sut.getVersion("newVersionId")
        assertThat(newVersion.id).isEqualTo("newVersionId")
        val created = LocalDateTime.parse(newVersion.created, ISO_LOCAL_DATE_TIME)
        assertThat(created).isBetween(now, soon)

        val updated = LocalDateTime.parse(newVersion.updated, ISO_LOCAL_DATE_TIME)
        assertThat(updated).isBetween(now, soon)

        val newVersionRecord =
                dsl.select(PROJECT_VERSION.STATE, PROJECT_VERSION.PROJECT_ID, PROJECT_VERSION.VERSION_NUMBER)
                        .from(PROJECT_VERSION)
                        .where(PROJECT_VERSION.ID.eq("newVersionId"))
                        .fetchOne()

        assertThat(newVersionRecord[PROJECT_VERSION.STATE]).isEqualTo("TEST STATE")
        assertThat(newVersionRecord[PROJECT_VERSION.PROJECT_ID]).isEqualTo(projectId)
        assertThat(newVersionRecord[PROJECT_VERSION.VERSION_NUMBER]).isEqualTo(2)

        val files = sut.getVersionFiles("newVersionId")
        assertThat(files.keys.count()).isEqualTo(2)
        assertThat(files["pjnz"]!!.hash).isEqualTo("pjnz_hash")
        assertThat(files["pjnz"]!!.filename).isEqualTo("pjnz_file")
        assertThat(files["survey"]!!.hash).isEqualTo("survey_hash")
        assertThat(files["survey"]!!.filename).isEqualTo("survey_file")
    }

    @Test
    fun `can promote a version to a new project`() {
        val now = LocalDateTime.now(ZoneOffset.UTC)
        val soon = now.plusSeconds(5)

        val uid = setupUser()
        val projectId = setupProject(uid)
        val newProjectId = setupProject(uid)
        sut.saveVersion(versionId, projectId)
        setUpHashAndVersionFile("pjnz_hash", "pjnz_file", versionId, "pjnz", false)
        setUpHashAndVersionFile("survey_hash", "survey_file", versionId, "survey", false)
        sut.saveVersionState(versionId, projectId, uid, "TEST STATE")

        sut.promoteVersion(versionId, "newVersionId", newProjectId, uid)

        val newVersion = sut.getVersion("newVersionId")
        assertThat(newVersion.id).isEqualTo("newVersionId")
        val created = LocalDateTime.parse(newVersion.created, ISO_LOCAL_DATE_TIME)
        assertThat(created).isBetween(now, soon)

        val updated = LocalDateTime.parse(newVersion.updated, ISO_LOCAL_DATE_TIME)
        assertThat(updated).isBetween(now, soon)

        val newVersionRecord =
                dsl.select(PROJECT_VERSION.STATE, PROJECT_VERSION.PROJECT_ID, PROJECT_VERSION.VERSION_NUMBER)
                        .from(PROJECT_VERSION)
                        .where(PROJECT_VERSION.ID.eq("newVersionId"))
                        .fetchOne()

        assertThat(newVersionRecord[PROJECT_VERSION.STATE]).isEqualTo("TEST STATE")
        assertThat(newVersionRecord[PROJECT_VERSION.PROJECT_ID]).isEqualTo(newProjectId)
        assertThat(newVersionRecord[PROJECT_VERSION.VERSION_NUMBER]).isEqualTo(1)

        val files = sut.getVersionFiles("newVersionId")
        assertThat(files.keys.count()).isEqualTo(2)
        assertThat(files["pjnz"]!!.hash).isEqualTo("pjnz_hash")
        assertThat(files["pjnz"]!!.filename).isEqualTo("pjnz_file")
        assertThat(files["survey"]!!.hash).isEqualTo("survey_hash")
        assertThat(files["survey"]!!.filename).isEqualTo("survey_file")
    }

    @Test
    fun `copy version throws error if version does not exist`() {
        val uid = setupUser()
        val projectId = setupProject(uid)
        assertThatThrownBy { sut.copyVersion("nonexistentVersion", "newVersion", projectId, uid) }
                .isInstanceOf(VersionException::class.java)
                .hasMessageContaining("versionDoesNotExist")
    }

    @Test
    fun `copy version throws error if version belongs to another project`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        assertThatThrownBy { sut.copyVersion(versionId, "newVersion", projectId + 1, uid) }
                .isInstanceOf(VersionException::class.java)
                .hasMessageContaining("versionDoesNotExist")
    }

    @Test
    fun `copy version throws error if version belongs to another user`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        assertThatThrownBy { sut.copyVersion(versionId, "newVersion", projectId, "not$uid") }
                .isInstanceOf(VersionException::class.java)
                .hasMessageContaining("versionDoesNotExist")
    }

    @Test
    fun `can clone version to new project`()
    {
        val uid = setupUser()
        val uid2 = setupUser("another.user@email.com")

        val originalProject = projectRepo.saveNewProject(uid, "p1")
        val originalVersionId = "v1"
        sut.saveVersion(originalVersionId, originalProject)
        sut.saveVersionState(originalVersionId, originalProject, uid, "{'something': 1}")
        setUpHashAndVersionFile("survey_hash", "survey_file", originalVersionId, "survey", false)

        val clonedProject = projectRepo.saveNewProject(uid2, "p1")
        val clonedVersionId = "v2"
        sut.cloneVersion(originalVersionId, clonedVersionId, clonedProject)

        val originalVersionDetails = sut.getVersionDetails(originalVersionId, originalProject, uid)
        val clonedVersionDetails = sut.getVersionDetails(clonedVersionId, clonedProject, uid2)
        assertThat(originalVersionDetails).isEqualToComparingFieldByFieldRecursively(clonedVersionDetails)
    }

    @Test
    fun `can get version`()
    {
        val now = LocalDateTime.now(ZoneOffset.UTC)
        val soon = now.plusSeconds(5)
        setUpVersion()
        val version = sut.getVersion(versionId)

        assertThat(version.id).isEqualTo(versionId)

        val created = LocalDateTime.parse(version.created, ISO_LOCAL_DATE_TIME)
        assertThat(created).isBetween(now, soon)

        val updated = LocalDateTime.parse(version.updated, ISO_LOCAL_DATE_TIME)
        assertThat(updated).isBetween(now, soon)

        assertThat(version.versionNumber).isEqualTo(1)
    }

    @Test
    fun `saveNewHash returns true if a new hash is saved`()
    {
        val result = sut.saveNewHash("newhash")
        assertThat(result).isTrue()
    }

    @Test
    fun `saveNewHash returns false if the hash already exists`()
    {
        sut.saveNewHash("newhash")
        val result = sut.saveNewHash("newhash")
        assertThat(result).isFalse()
    }

    @Test
    fun `saves new version file`()
    {
        setUpVersionAndHash()
        sut.saveVersionFile(versionId, FileType.PJNZ, "newhash", "original.pjnz", true)

        val record = dsl.selectFrom(VERSION_FILE)
                .fetchOne()

        assertThat(record[VERSION_FILE.FILENAME]).isEqualTo("original.pjnz")
        assertThat(record[VERSION_FILE.HASH]).isEqualTo("newhash")
        assertThat(record[VERSION_FILE.VERSION]).isEqualTo(versionId)
        assertThat(record[VERSION_FILE.TYPE]).isEqualTo("pjnz")
        assertThat(record[VERSION_FILE.FROM_ADR]).isEqualTo(true)
    }

    @Test
    fun `correct version file is removed`()
    {
        setUpVersionAndHash()
        val hash = "newhash"
        sut.saveVersionFile(versionId, FileType.PJNZ, hash, "original.pjnz", false)
        assertVersionFileExists(hash)

        // different file type
        sut.removeVersionFile(versionId, FileType.Survey)
        assertVersionFileExists(hash)

        // different version
        sut.removeVersionFile("wrongid", FileType.PJNZ)
        assertVersionFileExists(hash)

        // correct details
        sut.removeVersionFile(versionId, FileType.PJNZ)
        val records = dsl.selectFrom(VERSION_FILE)
                .where(VERSION_FILE.HASH.eq(hash))

        assertThat(records.count()).isEqualTo(0)
    }

    @Test
    fun `updates version file if an entry for the given type already exists`()
    {
        setUpVersionAndHash()
        sut.saveVersionFile(versionId, FileType.PJNZ, "newhash", "original.pjnz", false)

        sut.saveNewHash("anotherhash")
        sut.saveVersionFile(versionId, FileType.PJNZ, "anotherhash", "anotherfilename.pjnz", true)

        val records = dsl.selectFrom(VERSION_FILE)
                .fetch()

        assertThat(records.count()).isEqualTo(1)
        assertThat(records[0][VERSION_FILE.FILENAME]).isEqualTo("anotherfilename.pjnz")
        assertThat(records[0][VERSION_FILE.HASH]).isEqualTo("anotherhash")
        assertThat(records[0][VERSION_FILE.VERSION]).isEqualTo(versionId)
        assertThat(records[0][VERSION_FILE.TYPE]).isEqualTo("pjnz")
        assertThat(records[0][VERSION_FILE.FROM_ADR]).isEqualTo(true)
    }

    @Test
    fun `can get version file`()
    {
        setUpVersionAndHash()
        sut.saveVersionFile(versionId, FileType.PJNZ, "newhash", "original.pjnz", true)
        val result = sut.getVersionFile(versionId, FileType.PJNZ)!!
        assertThat(result.hash).isEqualTo("newhash")
        assertThat(result.filename).isEqualTo("original.pjnz")
        assertThat(result.fromADR).isEqualTo(true)
    }

    @Test
    fun `can get all version file hashes`()
    {
        setUpVersionAndHash()
        sut.saveNewHash("pjnzhash")
        sut.saveNewHash("surveyhash")
        sut.saveVersionFile(versionId, FileType.PJNZ, "pjnzhash", "original.pjnz", false)
        sut.saveVersionFile(versionId, FileType.Survey, "surveyhash", "original.csv", false)
        val result = sut.getHashesForVersion(versionId)
        assertThat(result["survey"]).isEqualTo("surveyhash")
        assertThat(result["pjnz"]).isEqualTo("pjnzhash")
    }

    @Test
    fun `can get all version files`()
    {
        setUpVersionAndHash()
        sut.saveNewHash("pjnzhash")
        sut.saveNewHash("surveyhash")
        sut.saveVersionFile(versionId, FileType.PJNZ, "pjnzhash", "original.pjnz", false)
        sut.saveVersionFile(versionId, FileType.Survey, "surveyhash", "original.csv", true)
        val result = sut.getVersionFiles(versionId)
        assertThat(result["survey"]!!.filename).isEqualTo("original.csv")
        assertThat(result["survey"]!!.hash).isEqualTo("surveyhash")
        assertThat(result["survey"]!!.fromADR).isEqualTo(true)

        assertThat(result["pjnz"]!!.filename).isEqualTo("original.pjnz")
        assertThat(result["pjnz"]!!.hash).isEqualTo("pjnzhash")
        assertThat(result["pjnz"]!!.fromADR).isEqualTo(false)
    }

    @Test
    fun `can set files for version`()
    {
        setUpVersion()
        sut.saveNewHash("pjnz_hash")
        sut.saveNewHash("shape_hash")

        sut.setFilesForVersion(versionId, mapOf(
                "pjnz" to VersionFile("pjnz_hash", "pjnz_file", false),
                "shape" to VersionFile("shape_hash", "shape_file", true),
                "population" to null //should not attempt to save a null file
        ));

        val records = dsl.selectFrom(VERSION_FILE)
                .orderBy(VERSION_FILE.TYPE)
                .fetch()

        assertThat(records.count()).isEqualTo(2);

        assertThat(records[0][VERSION_FILE.FILENAME]).isEqualTo("pjnz_file")
        assertThat(records[0][VERSION_FILE.HASH]).isEqualTo("pjnz_hash")
        assertThat(records[0][VERSION_FILE.VERSION]).isEqualTo(versionId)
        assertThat(records[0][VERSION_FILE.TYPE]).isEqualTo("pjnz")
        assertThat(records[0][VERSION_FILE.FROM_ADR]).isEqualTo(false)

        assertThat(records[1][VERSION_FILE.FILENAME]).isEqualTo("shape_file")
        assertThat(records[1][VERSION_FILE.HASH]).isEqualTo("shape_hash")
        assertThat(records[1][VERSION_FILE.VERSION]).isEqualTo(versionId)
        assertThat(records[1][VERSION_FILE.TYPE]).isEqualTo("shape")
        assertThat(records[1][VERSION_FILE.FROM_ADR]).isEqualTo(true)
    }

    @Test
    fun `setFilesForVersion deletes existing files for this version only`()
    {
        sut.saveVersion("sid2", null);

        sut.saveNewHash("shape_hash")
        setUpHashAndVersionFile("old_pjnz_hash", "old_pjnz", versionId, "pjnz")
        setUpHashAndVersionFile("other_shape_hash", "other_shape_file", "sid2", "shape")

        sut.setFilesForVersion(versionId, mapOf(
                "shape" to VersionFile("shape_hash", "shape_file", false)))

        val records = dsl.selectFrom(VERSION_FILE)
                .orderBy(VERSION_FILE.VERSION)
                .fetch()

        assertThat(records.count()).isEqualTo(2)

        assertThat(records[0][VERSION_FILE.FILENAME]).isEqualTo("shape_file")
        assertThat(records[0][VERSION_FILE.HASH]).isEqualTo("shape_hash")
        assertThat(records[0][VERSION_FILE.VERSION]).isEqualTo(versionId)
        assertThat(records[0][VERSION_FILE.TYPE]).isEqualTo("shape")

        assertThat(records[1][VERSION_FILE.FILENAME]).isEqualTo("other_shape_file")
        assertThat(records[1][VERSION_FILE.HASH]).isEqualTo("other_shape_hash")
        assertThat(records[1][VERSION_FILE.VERSION]).isEqualTo("sid2")
        assertThat(records[1][VERSION_FILE.TYPE]).isEqualTo("shape")
    }

    @Test
    fun `setFilesForSession rolls back transaction on error, leaving existing session files unchanged`()
    {
        setUpVersion()
        setUpHashAndVersionFile("pjnz_hash", "pjnz_file", versionId, "pjnz")

        TranslationAssert.assertThatThrownBy {
            sut.setFilesForVersion(versionId, mapOf(
                    "shape" to VersionFile("bad_hash", "bad_file", false)))
        }
                .isInstanceOf(VersionException::class.java)
                .hasTranslatedMessage("Unable to load files for session. Specified files do not exist on the server.")

        val records = dsl.selectFrom(VERSION_FILE)
                .orderBy(VERSION_FILE.VERSION)
                .fetch();

        assertThat(records.count()).isEqualTo(1);

        assertThat(records[0][VERSION_FILE.FILENAME]).isEqualTo("pjnz_file")
        assertThat(records[0][VERSION_FILE.HASH]).isEqualTo("pjnz_hash")
        assertThat(records[0][VERSION_FILE.VERSION]).isEqualTo(versionId)
        assertThat(records[0][VERSION_FILE.TYPE]).isEqualTo("pjnz")

    }

    @Test
    fun `can check version exists`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        sut.saveVersion(versionId, projectId)

        val result = sut.versionExists(versionId, uid)
        assertThat(result).isEqualTo(true)
    }

    @Test
    fun `returns false if version does not exist`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        sut.saveVersion("wrong version Id", projectId)

        val result = sut.versionExists(versionId, uid)
        assertThat(result).isEqualTo(false)
    }

    @Test
    fun `can get version details`()
    {

        val uid = setupUser()
        val projectId = setupProject(uid)
        sut.saveVersion(versionId, projectId)
        setUpHashAndVersionFile("pjnz_hash", "pjnz_file", versionId, "pjnz", false)
        setUpHashAndVersionFile("survey_hash", "survey_file", versionId, "survey", false)
        sut.saveVersionState(versionId, projectId, uid, "TEST STATE")

        val result = sut.getVersionDetails(versionId, projectId, uid)
        assertThat(result.state).isEqualTo("TEST STATE")

        val files = result.files
        assertThat(files.keys.count()).isEqualTo(2)
        assertThat(files["pjnz"]!!.hash).isEqualTo("pjnz_hash")
        assertThat(files["pjnz"]!!.filename).isEqualTo("pjnz_file")
        assertThat(files["survey"]!!.hash).isEqualTo("survey_hash")
        assertThat(files["survey"]!!.filename).isEqualTo("survey_file")
    }

    @Test
    fun `get version details throws error if version does not exist`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        assertThatThrownBy { sut.getVersionDetails("nonexistentVersion", projectId, uid) }
                .isInstanceOf(VersionException::class.java)
                .hasMessageContaining("versionDoesNotExist")
    }

    @Test
    fun `can delete version`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        sut.saveVersion(versionId, projectId)
        sut.saveVersion("another version", projectId)

        sut.deleteVersion(versionId, projectId, uid)

        val deleted = dsl.select(PROJECT_VERSION.DELETED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .fetchOne()[PROJECT_VERSION.DELETED]
        assertThat(deleted).isTrue()

        val notDeleted = dsl.select(PROJECT_VERSION.DELETED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq("another version"))
                .fetchOne()[PROJECT_VERSION.DELETED]
        assertThat(notDeleted).isFalse()
    }

    @Test
    fun `delete version throws error if version does not exist`()
    {
        val uid = setupUser()
        val projectId = setupProject(uid)
        assertThatThrownBy { sut.deleteVersion("nonexistentVersion", projectId, uid) }
                .isInstanceOf(VersionException::class.java)
                .hasMessageContaining("versionDoesNotExist")
    }

    @Test
    fun `copy version after delete version assigns unused version number to new version`()
    {
        //deleted version still exists, with deleted flag set, its version number should not be reused
        val uid = setupUser()
        val projectId = setupProject(uid);
        sut.saveVersion("version1", projectId);
        sut.copyVersion("version1", "version2", projectId, uid)
        sut.deleteVersion("version2", projectId, uid)

        sut.copyVersion("version1", "version3", projectId, uid)
        val version = sut.getVersion("version3")
        assertThat(version.versionNumber).isEqualTo(3)
    }

    private fun assertVersionFileExists(hash: String)
    {
        val records = dsl.selectFrom(VERSION_FILE)
                .where(VERSION_FILE.HASH.eq(hash))

        assertThat(records.count()).isEqualTo(1)
    }

    private fun setupUser(email: String = testEmail): String
    {
        userRepo.addUser(email, "pw")
        return userRepo.getUser(email)!!.id
    }

    private fun setupProject(userId: String): Int
    {
        return projectRepo.saveNewProject(userId, "testProject")
    }

    private fun setUpVersionAndHash()
    {
        sut.saveNewHash("newhash")
        setUpVersion()
    }

    private fun setUpVersion()
    {
        sut.saveVersion(versionId, null)
    }

    private fun setUpHashAndVersionFile(hash: String, filename: String, versionId: String, type: String, setUpVersion: Boolean = true)
    {
        sut.saveNewHash(hash)
        if (setUpVersion)
        {
            setUpVersion()
        }
        dsl.insertInto(VERSION_FILE)
                .set(VERSION_FILE.FILENAME, filename)
                .set(VERSION_FILE.HASH, hash)
                .set(VERSION_FILE.VERSION, versionId)
                .set(VERSION_FILE.TYPE, type)
                .execute()
    }

}
