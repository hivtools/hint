package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables.*
import org.imperial.mrc.hint.exceptions.SnapshotException
import org.imperial.mrc.hint.models.Snapshot
import org.imperial.mrc.hint.models.SnapshotDetails
import org.imperial.mrc.hint.models.SnapshotFile
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.impl.DSL
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Component

interface SnapshotRepository {
    fun saveSnapshot(snapshotId: String, versionId: Int?)
    fun getSnapshot(snapshotId: String): Snapshot

    // returns true if a new hash is saved, false if it already exists
    fun saveNewHash(hash: String): Boolean

    fun saveSnapshotFile(snapshotId: String, type: FileType, hash: String, fileName: String)
    fun removeSnapshotFile(snapshotId: String, type: FileType)
    fun getSnapshotFile(snapshotId: String, type: FileType): SnapshotFile?
    fun getHashesForSnapshot(snapshotId: String): Map<String, String>
    fun getSnapshotFiles(snapshotId: String): Map<String, SnapshotFile>
    fun setFilesForSnapshot(snapshotId: String, files: Map<String, SnapshotFile?>)
    fun saveSnapshotState(snapshotId: String, versionId: Int, userId: String, state: String)
    fun copySnapshot(parentSnapshotId: String, newSnapshotId: String, versionId: Int, userId: String)

    fun getSnapshotDetails(snapshotId: String, versionId: Int, userId: String): SnapshotDetails
}

@Component
class JooqSnapshotRepository(private val dsl: DSLContext) : SnapshotRepository {

    override fun saveSnapshot(snapshotId: String, versionId: Int?)
    {
        val snapshot = dsl.selectFrom(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(snapshotId))
                .firstOrNull()

        if (snapshot == null) {
            dsl.insertInto(PROJECT_VERSION)
                    .set(PROJECT_VERSION.ID, snapshotId)
                    .set(PROJECT_VERSION.PROJECT_ID, versionId)
                    .execute()
        }
    }

    override fun getSnapshot(snapshotId: String): Snapshot
    {
        val result =  dsl.select(PROJECT_VERSION.ID,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(snapshotId))
                .fetchOne()

        return Snapshot(result[PROJECT_VERSION.ID], result[PROJECT_VERSION.CREATED], result[PROJECT_VERSION.UPDATED])
    }

    override fun getSnapshotDetails(snapshotId: String, versionId: Int, userId: String): SnapshotDetails
    {
        checkSnapshotExists(snapshotId, versionId, userId)
        val files = getSnapshotFiles(snapshotId)
        val state = dsl.select(PROJECT_VERSION.STATE)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(snapshotId))
                .fetchOne()[PROJECT_VERSION.STATE]

        return SnapshotDetails(state, files)
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

    override fun saveSnapshotFile(snapshotId: String, type: FileType, hash: String, fileName: String) {

        if (getSnapshotFileRecord(snapshotId, type) == null) {
            dsl.insertInto(VERSION_FILE)
                    .set(VERSION_FILE.HASH, hash)
                    .set(VERSION_FILE.TYPE, type.toString())
                    .set(VERSION_FILE.VERSION, snapshotId)
                    .set(VERSION_FILE.FILENAME, fileName)
                    .execute()
        } else {
            dsl.update(VERSION_FILE)
                    .set(VERSION_FILE.HASH, hash)
                    .set(VERSION_FILE.FILENAME, fileName)
                    .where(VERSION_FILE.VERSION.eq(snapshotId))
                    .and(VERSION_FILE.TYPE.eq(type.toString()))
                    .execute()
        }

    }

    override fun removeSnapshotFile(snapshotId: String, type: FileType) {
        dsl.deleteFrom(VERSION_FILE)
                .where(VERSION_FILE.VERSION.eq(snapshotId))
                .and(VERSION_FILE.TYPE.eq(type.toString()))
                .execute()
    }

    override fun getSnapshotFile(snapshotId: String, type: FileType): SnapshotFile? {
        return getSnapshotFileRecord(snapshotId, type)?.into(SnapshotFile::class.java)
    }

    override fun getHashesForSnapshot(snapshotId: String): Map<String, String> {
        return dsl.select(VERSION_FILE.HASH, VERSION_FILE.TYPE)
                .from(VERSION_FILE)
                .where(VERSION_FILE.VERSION.eq(snapshotId))
                .associate { it[VERSION_FILE.TYPE] to it[VERSION_FILE.HASH] }
    }

    override fun getSnapshotFiles(snapshotId: String): Map<String, SnapshotFile> {
        return dsl.select(VERSION_FILE.HASH, VERSION_FILE.FILENAME,VERSION_FILE.TYPE)
                .from(VERSION_FILE)
                .where(VERSION_FILE.VERSION.eq(snapshotId))
                .associate { it[VERSION_FILE.TYPE] to SnapshotFile(it[VERSION_FILE.HASH], it[VERSION_FILE.FILENAME]) }
    }

    override fun setFilesForSnapshot(snapshotId: String, files: Map<String, SnapshotFile?>) {
        try {
            dsl.transaction { config ->
                val transaction = DSL.using(config)

                transaction.deleteFrom(VERSION_FILE)
                        .where(VERSION_FILE.VERSION.eq(snapshotId))
                        .execute()

                files.forEach { (fileType, snapshotFile) ->
                    if (snapshotFile != null) {
                        transaction.insertInto(VERSION_FILE)
                                .set(VERSION_FILE.HASH, snapshotFile.hash)
                                .set(VERSION_FILE.TYPE, fileType)
                                .set(VERSION_FILE.VERSION, snapshotId)
                                .set(VERSION_FILE.FILENAME, snapshotFile.filename)
                                .execute()
                    }
                }

            }
        } catch (e: DataIntegrityViolationException) {
            throw SnapshotException("loadFailed")
        }
    }

    override fun saveSnapshotState(snapshotId: String, versionId: Int, userId: String, state: String)
    {
        checkSnapshotExists(snapshotId, versionId, userId)
        dsl.update(PROJECT_VERSION)
                .set(PROJECT_VERSION.STATE, state)
                .where(PROJECT_VERSION.ID.eq(snapshotId))
                .execute()
    }

    override fun copySnapshot(parentSnapshotId: String, newSnapshotId: String, versionId: Int, userId: String)
    {
        checkSnapshotExists(parentSnapshotId, versionId, userId)

        dsl.insertInto(PROJECT_VERSION)
                .set(PROJECT_VERSION.ID, newSnapshotId)
                .set(PROJECT_VERSION.PROJECT_ID, versionId)
                .set(PROJECT_VERSION.STATE, dsl.select(PROJECT_VERSION.STATE)
                        .from(PROJECT_VERSION)
                        .where(PROJECT_VERSION.ID.eq(parentSnapshotId)))
                .execute()

        val files = getSnapshotFiles(parentSnapshotId)
        setFilesForSnapshot(newSnapshotId, files)
    }

    private fun checkSnapshotExists(snapshotId: String, versionId: Int, userId: String)
    {
        dsl.select(PROJECT_VERSION.ID)
                .from(PROJECT_VERSION)
                .join(PROJECT)
                .on(PROJECT_VERSION.PROJECT_ID.eq(PROJECT.ID))
                .where(PROJECT_VERSION.ID.eq(snapshotId))
                .and(PROJECT.ID.eq(versionId))
                .and(PROJECT.USER_ID.eq(userId))
                .fetchAny() ?: throw SnapshotException("snapshotDoesNotExist")
    }

    private fun getSnapshotFileRecord(snapshotId: String, type: FileType): Record? {
        return dsl.select(VERSION_FILE.HASH, VERSION_FILE.FILENAME)
                .from(VERSION_FILE)
                .where(VERSION_FILE.VERSION.eq(snapshotId))
                .and(VERSION_FILE.TYPE.eq(type.toString()))
                .fetchAny()
    }

}
