package org.imperial.mrc.hint.userCLI

import org.imperial.mrc.hint.exceptions.UserException
import org.assertj.core.api.Assertions
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationContext

//The hint db container must be running to run these tests
@ActiveProfiles(profiles=["test"])
@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class AppTests
{
    companion object {
        const val TEST_EMAIL = "test@test.com"
    }

    @Autowired
    private lateinit var context: ApplicationContext

    @Test
    fun `can add user`()
    {
        val sut = UserCLI(context)
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        Assertions.assertThat(sut.userExists(mapOf("<email>" to TEST_EMAIL))).isEqualTo("true")
    }


    @Test
    fun `can add user without password`()
    {
        val sut = UserCLI(context)
        sut.addUser(mapOf("<email>" to TEST_EMAIL))

        Assertions.assertThat(sut.userExists(mapOf("<email>" to TEST_EMAIL))).isEqualTo("true")
    }

    @Test
    fun `can remove user`()
    {
        val sut = UserCLI(context)
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        sut.removeUser(mapOf("<email>" to TEST_EMAIL))
        Assertions.assertThat(sut.userExists(mapOf("<email>" to TEST_EMAIL))).isEqualTo("false")
    }

    @Test
    fun `cannot add same user twice`()
    {
        val sut = UserCLI(context)
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        Assertions.assertThatThrownBy { sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword")) }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("User already exists")

    }

    @Test
    fun `cannot remove nonexistent user`()
    {
        val sut = UserCLI(context)
        Assertions.assertThatThrownBy{ sut.removeUser(mapOf("<email>" to "notaperson.@email.com")) }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("User does not exist")

    }
}