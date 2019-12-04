package org.imperial.mrc.hint.userCLI

import com.nhaarman.mockito_kotlin.eq
import com.nhaarman.mockito_kotlin.isNull
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.db.DbConfig
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.exceptions.UserException
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

//The hint db container must be running to run these tests
class AppTests {

    companion object {
        const val TEST_EMAIL = "test@test.com"

        val dataSource = DbConfig().dataSource(ConfiguredAppProperties())
        val userRepository = getUserRepository(dataSource)
        val sut = UserCLI(userRepository)

        @AfterAll
        @JvmStatic
        fun cleanup() {
            dataSource.connection.close()
        }
    }

    @BeforeEach
    fun `remove user if exists`() {
        try {
            sut.removeUser(mapOf("<email>" to TEST_EMAIL))
        }
        catch (e: Exception) {

        }
    }

    @Test
    fun `can add user`() {
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        Assertions.assertThat(sut.userExists(mapOf("<email>" to TEST_EMAIL))).isEqualTo("true")
    }


    @Test
    fun `can add user without password`()
    {
        sut.addUser(mapOf("<email>" to TEST_EMAIL))
        Assertions.assertThat(sut.userExists(mapOf("<email>" to TEST_EMAIL))).isEqualTo("true")
    }

    @Test
    fun `null password gets passed to user repo`() {
        val mockUserRepo = mock<UserLogic>()
        UserCLI(mockUserRepo).addUser(mapOf("<email>" to TEST_EMAIL))
        verify(mockUserRepo).addUser(eq(TEST_EMAIL), isNull())
    }

    @Test
    fun `can remove user`() {
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        sut.removeUser(mapOf("<email>" to TEST_EMAIL))
        Assertions.assertThat(sut.userExists(mapOf("<email>" to TEST_EMAIL))).isEqualTo("false")
    }

    @Test
    fun `cannot add same user twice`() {
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        Assertions.assertThatThrownBy { sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword")) }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("User already exists")

    }

    @Test
    fun `cannot remove nonexistent user`() {
        Assertions.assertThatThrownBy { sut.removeUser(mapOf("<email>" to "notaperson.@email.com")) }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("User does not exist")

    }
}
