package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.helpers.TranslationAssert
import org.imperial.mrc.hint.logic.UserLogic
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

//Database should be running (via ./scripts/run-dependencies.sh)
@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class UserLogicTests
{
    @Autowired
    private lateinit var sut: UserLogic

    companion object
    {
        const val TEST_EMAIL = "test@test.com"
    }

    @Test
    fun `can add user`()
    {
        sut.addUser(TEST_EMAIL, "testpassword")

        assertThat(sut.getUser(TEST_EMAIL)).isNotNull
    }


    @Test
    fun `can add guest user`()
    {
        sut.addUser("guest", "guest")

        assertThat(sut.getUser("guest")).isNotNull
    }

    @Test
    fun `can add user without password`()
    {
        sut.addUser(TEST_EMAIL, null)

        assertThat(sut.getUser(TEST_EMAIL)).isNotNull
    }

    @Test
    fun `emails without @ signs are invalid`()
    {

        TranslationAssert.assertThatThrownBy { sut.addUser("email", "testpassword") }
                .isInstanceOf(UserException::class.java)
                .hasTranslatedMessage("Please provide a valid email address.")
    }

    @Test
    fun `can remove user`()
    {
        sut.addUser(TEST_EMAIL, "testpassword")

        sut.removeUser(TEST_EMAIL)
        assertThat(sut.getUser(TEST_EMAIL)).isNull()
    }

    @Test
    fun `can remove user with differently cased domain`()
    {
        sut.addUser("test@test.com", "testpassword")

        sut.removeUser("test@TEST.com")
        assertThat(sut.getUser("test@test.com")).isNull()
    }

    @Test
    fun `can remove user with differently cased prefix`()
    {
        sut.addUser("test@test.com", "testpassword")

        sut.removeUser("TEST@test.com")
        assertThat(sut.getUser("test@test.com")).isNull()
    }

    @Test
    fun `cannot add same user twice`()
    {
        sut.addUser(TEST_EMAIL, "testpassword")

        TranslationAssert.assertThatThrownBy { sut.addUser(TEST_EMAIL, "testpassword") }
                .isInstanceOf(UserException::class.java)
                .hasTranslatedMessage("User already exists.")

    }

    @Test
    fun `cannot add same user twice with differently cased domain`()
    {
        sut.addUser("test@test.com", "testpassword")

        TranslationAssert.assertThatThrownBy { sut.addUser("test@TEST.com", "testpassword") }
                .isInstanceOf(UserException::class.java)
                .hasTranslatedMessage("User already exists.")

    }

    @Test
    fun `cannot add same user twice with differently cased prefix`()
    {
        sut.addUser("test@test.com", "testpassword")

        TranslationAssert.assertThatThrownBy { sut.addUser("TEST@test.com", "testpassword") }
                .isInstanceOf(UserException::class.java)
                .hasTranslatedMessage("User already exists.")

    }

    @Test
    fun `cannot remove nonexistent user`()
    {
        TranslationAssert.assertThatThrownBy { sut.removeUser("notaperson@email.com") }
                .isInstanceOf(UserException::class.java)
                .hasTranslatedMessage("User does not exist.")
    }

    @Test
    fun `can get user`()
    {
        sut.addUser(TEST_EMAIL, "testpassword")
        assertThat(sut.getUser(TEST_EMAIL)!!.username).isEqualTo(TEST_EMAIL)
    }

    @Test
    fun `can get user with differently cased domain`()
    {
        sut.addUser("test@test.com", "testpassword")
        assertThat(sut.getUser("test@TEST.com")!!.username).isEqualTo(TEST_EMAIL)
    }

    @Test
    fun `can get user with differently cased prefix`()
    {
        sut.addUser("test@test.com", "testpassword")
        assertThat(sut.getUser("TEST@test.com")!!.username).isEqualTo(TEST_EMAIL)
    }

    @Test
    fun `throws error if trying to get user with invalid email`()
    {
        TranslationAssert.assertThatThrownBy { sut.getUser("email") }
                .isInstanceOf(UserException::class.java)
                .hasTranslatedMessage("Please provide a valid email address.")
    }

}