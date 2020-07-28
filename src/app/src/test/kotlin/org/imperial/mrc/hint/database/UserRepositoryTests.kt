package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.ADR_KEY
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.security.Encryption
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
    private val encryption = Encryption()
    private val testKey = "123-some-key"

    @Test
    fun `can save new API key`() {
        userRepo.addUser(testEmail, "pw")

        val encryptedKey = encryption.encrypt(testKey)
        sut.saveADRKey(testEmail, encryptedKey)

        val key = sut.getADRKey(testEmail)
        assertThat(key).isEqualTo(encryptedKey)
    }

    @Test
    fun `can update API key`() {
        userRepo.addUser(testEmail, "pw")
        val encryptedKey = encryption.encrypt(testKey)
        val newEncryptedKey = encryption.encrypt("new-key-456")

        sut.saveADRKey(testEmail, encryptedKey)
        sut.saveADRKey(testEmail, newEncryptedKey)

        val key = sut.getADRKey(testEmail)
        assertThat(key).isEqualTo(newEncryptedKey)
    }


    @Test
    fun `can delete API key`() {
        userRepo.addUser(testEmail, "pw")
        val encryptedKey = encryption.encrypt(testKey)

        sut.saveADRKey(testEmail, encryptedKey)
        sut.deleteADRKey(testEmail)

        val keys = dsl.selectFrom(ADR_KEY)
                .where(ADR_KEY.USER_ID.eq(testEmail))
                .fetch()

        assertThat(keys.any()).isFalse()
    }

    @Test
    fun `can retrieve API key`() {
        userRepo.addUser(testEmail, "pw")
        val encryptedKey = encryption.encrypt(testKey)

        sut.saveADRKey(testEmail, encryptedKey)
        val result = sut.getADRKey(testEmail)!!
        assertThat(encryption.decrypt(result)).isEqualTo(testKey)
    }

    @Test
    fun `returns null if API key does not exist`() {
        userRepo.addUser(testEmail, "pw")
        val result = sut.getADRKey(testEmail)
        assertThat(result).isEqualTo(null)
    }
}
