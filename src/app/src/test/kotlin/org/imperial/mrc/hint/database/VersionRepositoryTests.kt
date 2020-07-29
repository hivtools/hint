package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.db.tables.Version.VERSION
import org.imperial.mrc.hint.db.tables.VersionSnapshot.VERSION_SNAPSHOT
import org.imperial.mrc.hint.logic.UserLogic
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.sql.Timestamp
import java.time.Instant
import java.time.Instant.now
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@Transactional
class VersionRepositoryTests {
    @Autowired
    private lateinit var sut: VersionRepository

    @Autowired
    private lateinit var userRepo: UserLogic

    @Autowired
    private lateinit var dsl: DSLContext

    private val testEmail = "test@test.com"

    @Test
    fun `can save new version`()
    {
        userRepo.addUser(testEmail, "pw")
        val uid = userRepo.getUser(testEmail)!!.id

        val versionId = sut.saveNewVersion(uid, "testVersionRepo")

        val version = dsl.selectFrom(VERSION)
                .where(VERSION.ID.eq(versionId))
                .fetchOne()

        assertThat(version[VERSION.USER_ID]).isEqualTo(uid)
        assertThat(version[VERSION.NAME]).isEqualTo("testVersionRepo")
    }

    @Test
    fun `can get versions for user`()
    {
        userRepo.addUser(testEmail, "pw")
        val userId = userRepo.getUser(testEmail)!!.id

        userRepo.addUser("another.user@example.com", "pw")
        val anotherUserId = userRepo.getUser("another.user@example.com")!!.id

        val ago_1h = now().minus(1, ChronoUnit.HOURS)
        val ago_2h = now().minus(2, ChronoUnit.HOURS)
        val ago_3h = now().minus(3, ChronoUnit.HOURS)
        val ago_4h = now().minus(4, ChronoUnit.HOURS)


        val v1Id = insertVersion("v1", userId)
        val v2Id = insertVersion("v2", userId)
        val anotherVersion = insertVersion("v2", anotherUserId) //should not be returned

        insertSnapshot("v1s1", v1Id, ago_4h, ago_3h, false)
        insertSnapshot("v1s2", v1Id, ago_2h, ago_2h, false)

        insertSnapshot("deletedSnap", v2Id, ago_1h, now(), true) //should not be returned
        insertSnapshot("v2s1", v2Id, ago_3h, ago_1h, false)

        insertSnapshot("anotherSnap", anotherVersion, ago_1h, ago_1h, false)

        val versions = sut.getVersions(userId)
        assertThat(versions.count()).isEqualTo(2)

        val v2 = versions[0]
        assertThat(v2.id).isEqualTo(v2Id)
        assertThat(v2.name).isEqualTo("v2")
        assertThat(v2.snapshots.count()).isEqualTo(1)
        assertThat(v2.snapshots[0].id).isEqualTo("v2s1")
        assertThat(v2.snapshots[0].created).isEqualTo(format(ago_3h))
        assertThat(v2.snapshots[0].updated).isEqualTo(format(ago_1h))

        val v1 = versions[1]
        assertThat(v1.id).isEqualTo(v1Id)
        assertThat(v1.name).isEqualTo("v1")
        assertThat(v1.snapshots.count()).isEqualTo(2)
        assertThat(v1.snapshots[0].id).isEqualTo("v1s2")
        assertThat(v1.snapshots[0].created).isEqualTo(format(ago_2h))
        assertThat(v1.snapshots[0].updated).isEqualTo(format(ago_2h))
        assertThat(v1.snapshots[1].id).isEqualTo("v1s1")
        assertThat(v1.snapshots[1].created).isEqualTo(format(ago_4h))
        assertThat(v1.snapshots[1].updated).isEqualTo(format(ago_3h))
    }

    private fun format(time: Instant): String
    {
        val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
        return formatter.format(LocalDateTime.ofInstant(time, ZoneId.systemDefault()))
    }

    private fun insertVersion(name: String, userId: String): Int
    {
        val saved = dsl.insertInto(VERSION, VERSION.USER_ID, VERSION.NAME)
                .values(userId, name)
                .returning(VERSION.ID)
                .fetchOne()

        return saved[VERSION.ID]
    }

    private fun insertSnapshot(snapshotId: String, versionId: Int, created: Instant, updated: Instant, deleted: Boolean)
    {
        dsl.insertInto(VERSION_SNAPSHOT,
                VERSION_SNAPSHOT.ID,
                VERSION_SNAPSHOT.VERSION_ID,
                VERSION_SNAPSHOT.CREATED,
                VERSION_SNAPSHOT.UPDATED,
                VERSION_SNAPSHOT.DELETED)
                .values(snapshotId, versionId, Timestamp.from(created), Timestamp.from(updated), deleted)
                .execute()
    }
}
