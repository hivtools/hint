package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.Tables.FILE
import org.imperial.mrc.hint.db.Tables.VERSION_SNAPSHOT
import org.imperial.mrc.hint.db.Tables.SNAPSHOT_FILE
import org.imperial.mrc.hint.exceptions.SnapshotException
import org.imperial.mrc.hint.models.Snapshot
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
}

@Component
class JooqSnapshotRepository(private val dsl: DSLContext) : SnapshotRepository {

    override fun saveSnapshot(snapshotId: String, versionId: Int?) {

        val snapshot = dsl.selectFrom(VERSION_SNAPSHOT)
                .where(VERSION_SNAPSHOT.ID.eq(snapshotId))
                .firstOrNull()

        if (snapshot == null) {
            dsl.insertInto(VERSION_SNAPSHOT)
                    .set(VERSION_SNAPSHOT.ID, snapshotId)
                    .set(VERSION_SNAPSHOT.VERSION_ID, versionId)
                    .execute()
        }
    }

    override fun getSnapshot(snapshotId: String): Snapshot
    {
        val result =  dsl.select(VERSION_SNAPSHOT.ID,
                VERSION_SNAPSHOT.CREATED,
                VERSION_SNAPSHOT.UPDATED)
                .from(VERSION_SNAPSHOT)
                .where(VERSION_SNAPSHOT.ID.eq(snapshotId))
                .fetchOne()

        return Snapshot(result[VERSION_SNAPSHOT.ID], result[VERSION_SNAPSHOT.CREATED], result[VERSION_SNAPSHOT.UPDATED])
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
            dsl.insertInto(SNAPSHOT_FILE)
                    .set(SNAPSHOT_FILE.HASH, hash)
                    .set(SNAPSHOT_FILE.TYPE, type.toString())
                    .set(SNAPSHOT_FILE.SNAPSHOT, snapshotId)
                    .set(SNAPSHOT_FILE.FILENAME, fileName)
                    .execute()
        } else {
            dsl.update(SNAPSHOT_FILE)
                    .set(SNAPSHOT_FILE.HASH, hash)
                    .set(SNAPSHOT_FILE.FILENAME, fileName)
                    .where(SNAPSHOT_FILE.SNAPSHOT.eq(snapshotId))
                    .and(SNAPSHOT_FILE.TYPE.eq(type.toString()))
                    .execute()
        }

    }

    override fun removeSnapshotFile(snapshotId: String, type: FileType) {
        dsl.deleteFrom(SNAPSHOT_FILE)
                .where(SNAPSHOT_FILE.SNAPSHOT.eq(snapshotId))
                .and(SNAPSHOT_FILE.TYPE.eq(type.toString()))
                .execute()
    }

    override fun getSnapshotFile(snapshotId: String, type: FileType): SnapshotFile? {
        return getSnapshotFileRecord(snapshotId, type)?.into(SnapshotFile::class.java)
    }

    override fun getHashesForSnapshot(snapshotId: String): Map<String, String> {
        return dsl.select(SNAPSHOT_FILE.HASH, SNAPSHOT_FILE.TYPE)
                .from(SNAPSHOT_FILE)
                .where(SNAPSHOT_FILE.SNAPSHOT.eq(snapshotId))
                .associate { it[SNAPSHOT_FILE.TYPE] to it[SNAPSHOT_FILE.HASH] }
    }

    override fun getSnapshotFiles(snapshotId: String): Map<String, SnapshotFile> {
        return dsl.select(SNAPSHOT_FILE.HASH, SNAPSHOT_FILE.FILENAME,SNAPSHOT_FILE.TYPE)
                .from(SNAPSHOT_FILE)
                .where(SNAPSHOT_FILE.SNAPSHOT.eq(snapshotId))
                .associate { it[SNAPSHOT_FILE.TYPE] to SnapshotFile(it[SNAPSHOT_FILE.HASH], it[SNAPSHOT_FILE.FILENAME]) }
    }

    override fun setFilesForSnapshot(snapshotId: String, files: Map<String, SnapshotFile?>) {
        try {
            dsl.transaction { config ->
                val transaction = DSL.using(config)

                transaction.deleteFrom(SNAPSHOT_FILE)
                        .where(SNAPSHOT_FILE.SNAPSHOT.eq(snapshotId))
                        .execute()

                files.forEach { (fileType, snapshotFile) ->
                    if (snapshotFile != null) {
                        transaction.insertInto(SNAPSHOT_FILE)
                                .set(SNAPSHOT_FILE.HASH, snapshotFile.hash)
                                .set(SNAPSHOT_FILE.TYPE, fileType)
                                .set(SNAPSHOT_FILE.SNAPSHOT, snapshotId)
                                .set(SNAPSHOT_FILE.FILENAME, snapshotFile.filename)
                                .execute()
                    }
                }

            }
        } catch (e: DataIntegrityViolationException) {
            throw SnapshotException("loadFailed")
        }
    }

    private fun getSnapshotFileRecord(snapshotId: String, type: FileType): Record? {
        return dsl.select(SNAPSHOT_FILE.HASH, SNAPSHOT_FILE.FILENAME)
                .from(SNAPSHOT_FILE)
                .where(SNAPSHOT_FILE.SNAPSHOT.eq(snapshotId))
                .and(SNAPSHOT_FILE.TYPE.eq(type.toString()))
                .fetchAny()
    }

}
