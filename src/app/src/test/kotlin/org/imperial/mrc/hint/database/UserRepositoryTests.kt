package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.ADR_KEY
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.logic.UserLogic
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class UserRepositoryTests {

    @Autowired
    private lateinit var sut: UserRepository

    @Autowired
    private lateinit var dsl: DSLContext

    @Autowired
    private lateinit var userRepo: UserLogic

    private val testEmail = "test@test.com"

    @Test
    fun `can save new API key`() {
        userRepo.addUser(testEmail, "pw")

        sut.saveADRKey(testEmail, "encryptedkey")

        val key = dsl.selectFrom(ADR_KEY)
                .where(ADR_KEY.USER_ID.eq(testEmail))
                .fetchAny()

        assertThat(key).isEqualTo("encryptedkey")
    }

    @Test
    fun `can update API key`() {
        userRepo.addUser(testEmail, "pw")

        sut.saveADRKey(testEmail, "encryptedkey")
        sut.saveADRKey(testEmail, "newkey")

        val key = dsl.selectFrom(ADR_KEY)
                .where(ADR_KEY.USER_ID.eq(testEmail))
                .fetchAny()

        assertThat(key).isEqualTo("newkey")
    }


    @Test
    fun `can delete API key`() {
        userRepo.addUser(testEmail, "pw")

        sut.saveADRKey(testEmail, "encryptedkey")
        sut.deleteADRKey(testEmail)

        val keys = dsl.selectFrom(ADR_KEY)
                .where(ADR_KEY.USER_ID.eq(testEmail))
                .fetch()

        assertThat(keys.any()).isFalse()
    }
}