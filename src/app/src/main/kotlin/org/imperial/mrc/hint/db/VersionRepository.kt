package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables.*
import org.imperial.mrc.hint.exceptions.VersionException
import org.imperial.mrc.hint.models.Version
import org.imperial.mrc.hint.models.VersionDetails
import org.imperial.mrc.hint.models.VersionFile
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.impl.DSL
import org.jooq.impl.DSL.`val`
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Component

interface VersionRepository
{
    fun saveVersion(versionId: String, projectId: Int?, note: String? = null)
    fun getVersion(versionId: String): Version

    // returns true if a new hash is saved, false if it already exists
    fun saveNewHash(hash: String): Boolean

    fun saveVersionFile(versionId: String, type: FileType, hash: String, fileName: String, fromADR: Boolean)
    fun removeVersionFile(versionId: String, type: FileType)
    fun getVersionFile(versionId: String, type: FileType): VersionFile?
    fun getHashesForVersion(versionId: String): Map<String, String>
    fun getVersionFiles(versionId: String): Map<String, VersionFile>
    fun setFilesForVersion(versionId: String, files: Map<String, VersionFile?>)
    fun saveVersionState(versionId: String, projectId: Int, userId: String, state: String)
    fun copyVersion(parentVersionId: String, newVersionId: String, projectId: Int, userId: String, note: String? = null)
    fun promoteVersion(parentVersionId: String, newVersionId: String, newProjectId: Int, userId: String)
    fun cloneVersion(parentVersionId: String, newVersionId: String, newProjectId: Int, note: String? = null)

    fun getVersionDetails(versionId: String, projectId: Int, userId: String): VersionDetails

    fun deleteVersion(versionId: String, projectId: Int, userId: String)
    fun versionExists(versionId: String, userId: String): Boolean
    fun updateVersionNote(versionId: String, projectId: Int, userId: String, note: String)
}

@Component
class JooqVersionRepository(private val dsl: DSLContext) : VersionRepository
{

    override fun saveVersion(versionId: String, projectId: Int?, note: String?)
    {
        val version = dsl.selectFrom(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .firstOrNull()

        if (version == null)
        {
            val versionNumber = getNextVersionNumber(projectId)
            dsl.insertInto(PROJECT_VERSION)
                    .set(PROJECT_VERSION.ID, versionId)
                    .set(PROJECT_VERSION.NOTE, note)
                    .set(PROJECT_VERSION.PROJECT_ID, projectId)
                    .set(PROJECT_VERSION.VERSION_NUMBER, versionNumber)
                    .execute()
        }
    }

    override fun getVersion(versionId: String): Version
    {
        val result = dsl.select(PROJECT_VERSION.ID,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED,
                PROJECT_VERSION.NOTE,
                PROJECT_VERSION.VERSION_NUMBER)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .fetchOne()

        return Version(result[PROJECT_VERSION.ID], result[PROJECT_VERSION.CREATED],
                result[PROJECT_VERSION.UPDATED], result[PROJECT_VERSION.VERSION_NUMBER], result[PROJECT_VERSION.NOTE])
    }

    override fun getVersionDetails(versionId: String, projectId: Int, userId: String): VersionDetails
    {
        checkVersionExists(versionId, projectId, userId)
        val files = getVersionFiles(versionId)
        val state = dsl.select(PROJECT_VERSION.STATE)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .fetchOne()[PROJECT_VERSION.STATE]

        return VersionDetails(state, files)
    }

    override fun saveNewHash(hash: String): Boolean
    {

        val record = dsl.selectFrom(FILE)
                .where(FILE.HASH.eq(hash))
                .firstOrNull()

        return if (record == null)
        {
            dsl.insertInto(FILE)
                    .set(FILE.HASH, hash)
                    .execute()
            true
        }
        else
        {
            false
        }
    }

    override fun saveVersionFile(versionId: String, type: FileType, hash: String, fileName: String, fromADR: Boolean)
    {

        if (getVersionFileRecord(versionId, type) == null)
        {
            dsl.insertInto(VERSION_FILE)
                    .set(VERSION_FILE.HASH, hash)
                    .set(VERSION_FILE.TYPE, type.toString())
                    .set(VERSION_FILE.VERSION, versionId)
                    .set(VERSION_FILE.FILENAME, fileName)
                    .set(VERSION_FILE.FROM_ADR, fromADR)
                    .execute()
        }
        else
        {
            dsl.update(VERSION_FILE)
                    .set(VERSION_FILE.HASH, hash)
                    .set(VERSION_FILE.FILENAME, fileName)
                    .set(VERSION_FILE.FROM_ADR, fromADR)
                    .where(VERSION_FILE.VERSION.eq(versionId))
                    .and(VERSION_FILE.TYPE.eq(type.toString()))
                    .execute()
        }

    }

    override fun removeVersionFile(versionId: String, type: FileType)
    {
        dsl.deleteFrom(VERSION_FILE)
                .where(VERSION_FILE.VERSION.eq(versionId))
                .and(VERSION_FILE.TYPE.eq(type.toString()))
                .execute()
    }

    override fun getVersionFile(versionId: String, type: FileType): VersionFile?
    {
        return getVersionFileRecord(versionId, type)?.into(VersionFile::class.java)
    }

    override fun getHashesForVersion(versionId: String): Map<String, String>
    {
        return dsl.select(VERSION_FILE.HASH, VERSION_FILE.TYPE)
                .from(VERSION_FILE)
                .where(VERSION_FILE.VERSION.eq(versionId))
                .associate { it[VERSION_FILE.TYPE] to it[VERSION_FILE.HASH] }
    }

    override fun getVersionFiles(versionId: String): Map<String, VersionFile>
    {
        return dsl.select(VERSION_FILE.HASH, VERSION_FILE.FILENAME, VERSION_FILE.TYPE, VERSION_FILE.FROM_ADR)
                .from(VERSION_FILE)
                .where(VERSION_FILE.VERSION.eq(versionId))
                .associate {
                    it[VERSION_FILE.TYPE] to
                            VersionFile(it[VERSION_FILE.HASH], it[VERSION_FILE.FILENAME], it[VERSION_FILE.FROM_ADR])
                }
    }

    override fun setFilesForVersion(versionId: String, files: Map<String, VersionFile?>)
    {
        try
        {
            dsl.transaction { config ->
                val transaction = DSL.using(config)

                transaction.deleteFrom(VERSION_FILE)
                        .where(VERSION_FILE.VERSION.eq(versionId))
                        .execute()

                files.forEach { (fileType, versionFile) ->
                    if (versionFile != null)
                    {
                        transaction.insertInto(VERSION_FILE)
                                .set(VERSION_FILE.HASH, versionFile.hash)
                                .set(VERSION_FILE.TYPE, fileType)
                                .set(VERSION_FILE.VERSION, versionId)
                                .set(VERSION_FILE.FILENAME, versionFile.filename)
                                .set(VERSION_FILE.FROM_ADR, versionFile.fromADR)
                                .execute()
                    }
                }

            }
        }
        catch (e: DataIntegrityViolationException)
        {
            throw VersionException("loadFailed")
        }
    }

    override fun saveVersionState(versionId: String, projectId: Int, userId: String, state: String)
    {
        checkVersionExists(versionId, projectId, userId)
        dsl.update(PROJECT_VERSION)
                .set(PROJECT_VERSION.STATE, state)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .execute()
    }

    override fun updateVersionNote(versionId: String, projectId: Int, userId: String, note: String)
    {
        checkVersionExists(versionId, projectId, userId)
        dsl.update(PROJECT_VERSION)
                .set(PROJECT_VERSION.NOTE, note)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .execute()
    }

    override fun cloneVersion(parentVersionId: String, newVersionId: String, newProjectId: Int, note: String?)
    {

        dsl.insertInto(PROJECT_VERSION,
                PROJECT_VERSION.PROJECT_ID,
                PROJECT_VERSION.ID,
                PROJECT_VERSION.NOTE,
                PROJECT_VERSION.VERSION_NUMBER,
                PROJECT_VERSION.STATE,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED)
                .select(dsl.select(`val`(newProjectId),
                        `val`(newVersionId),
                        `val`(note),
                        PROJECT_VERSION.VERSION_NUMBER,
                        PROJECT_VERSION.STATE,
                        PROJECT_VERSION.CREATED,
                        PROJECT_VERSION.UPDATED)
                        .from(PROJECT_VERSION)
                        .where(PROJECT_VERSION.ID.eq(parentVersionId)))
                .execute()

        val files = getVersionFiles(parentVersionId)
        setFilesForVersion(newVersionId, files)
    }

    override fun copyVersion(
            parentVersionId: String,
            newVersionId: String,
            projectId: Int,
            userId: String,
            note: String?)
    {
        checkVersionExists(parentVersionId, projectId, userId)
        val versionNumber = getNextVersionNumber(projectId)
        dsl.insertInto(PROJECT_VERSION)
                .set(PROJECT_VERSION.ID, newVersionId)
                .set(PROJECT_VERSION.NOTE, note)
                .set(PROJECT_VERSION.PROJECT_ID, projectId)
                .set(PROJECT_VERSION.VERSION_NUMBER, versionNumber)
                .set(PROJECT_VERSION.STATE, dsl.select(PROJECT_VERSION.STATE)
                        .from(PROJECT_VERSION)
                        .where(PROJECT_VERSION.ID.eq(parentVersionId)))
                .execute()

        val files = getVersionFiles(parentVersionId)
        setFilesForVersion(newVersionId, files)
    }

    override fun promoteVersion(parentVersionId: String, newVersionId: String, newProjectId: Int, userId: String)
    {
        val versionNumber = getNextVersionNumber(newProjectId)
        dsl.insertInto(PROJECT_VERSION)
                .set(PROJECT_VERSION.ID, newVersionId)
                .set(PROJECT_VERSION.PROJECT_ID, newProjectId)
                .set(PROJECT_VERSION.VERSION_NUMBER, versionNumber)
                .set(PROJECT_VERSION.STATE, dsl.select(PROJECT_VERSION.STATE)
                        .from(PROJECT_VERSION)
                        .where(PROJECT_VERSION.ID.eq(parentVersionId)))
                .execute()

        val files = getVersionFiles(parentVersionId)
        setFilesForVersion(newVersionId, files)
    }

    override fun deleteVersion(versionId: String, projectId: Int, userId: String) {
        checkVersionExists(versionId, projectId, userId);
        dsl.update(PROJECT_VERSION)
                .set(PROJECT_VERSION.DELETED, true)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .execute()
    }

    override fun versionExists(versionId: String, userId: String): Boolean
    {
        return dsl.select(PROJECT_VERSION.ID)
                .from(PROJECT_VERSION)
                .join(PROJECT)
                .on(PROJECT_VERSION.PROJECT_ID.eq(PROJECT.ID))
                .where(PROJECT_VERSION.ID.eq(versionId))
                .and(PROJECT.USER_ID.eq(userId))
                .fetchAny() != null
    }

    private fun checkVersionExists(versionId: String, projectId: Int, userId: String)
    {
        dsl.select(PROJECT_VERSION.ID)
                .from(PROJECT_VERSION)
                .join(PROJECT)
                .on(PROJECT_VERSION.PROJECT_ID.eq(PROJECT.ID))
                .where(PROJECT_VERSION.ID.eq(versionId))
                .and(PROJECT.ID.eq(projectId))
                .and(PROJECT.USER_ID.eq(userId))
                .fetchAny() ?: throw VersionException("versionDoesNotExist")
    }

    private fun getVersionFileRecord(versionId: String, type: FileType): Record?
    {
        return dsl.select(VERSION_FILE.HASH, VERSION_FILE.FILENAME, VERSION_FILE.FROM_ADR)
                .from(VERSION_FILE)
                .where(VERSION_FILE.VERSION.eq(versionId))
                .and(VERSION_FILE.TYPE.eq(type.toString()))
                .fetchAny()
    }

    private fun getNextVersionNumber(projectId: Int?): Int
    {
        val max = dsl.select(PROJECT_VERSION.VERSION_NUMBER.max())
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.PROJECT_ID.eq(projectId))
                .fetchOne(PROJECT_VERSION.VERSION_NUMBER.max())
        return (max ?: 0) + 1
    }

}
