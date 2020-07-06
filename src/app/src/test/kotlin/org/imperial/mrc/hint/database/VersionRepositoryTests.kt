package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.db.tables.Version.VERSION
import org.imperial.mrc.hint.logic.UserLogic
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

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
}
