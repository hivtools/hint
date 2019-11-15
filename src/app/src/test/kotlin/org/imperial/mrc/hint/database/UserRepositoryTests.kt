package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional

//Database should be running (via ./scripts/run-dependencies.sh)
@ActiveProfiles(profiles=["test"])
@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional
class UserRepositoryTests {
    @Autowired
    private lateinit var sut: UserRepository

    companion object {
        const val TEST_EMAIL = "test@test.com"
    }

    @Test
    fun `can add user`()
    {
        sut.addUser(TEST_EMAIL, "testpassword")

        Assertions.assertThat(sut.getUser(TEST_EMAIL)).isNotNull
    }

    @Test
    fun `can add user without password`()
    {
        sut.addUser(TEST_EMAIL, null)

        Assertions.assertThat(sut.getUser(TEST_EMAIL)).isNotNull
    }

    @Test
    fun `can remove user`()
    {
        sut.addUser(TEST_EMAIL, "testpassword")

        sut.removeUser(TEST_EMAIL)
        Assertions.assertThat(sut.getUser(TEST_EMAIL)).isNull()
    }

    @Test
    fun `cannot add same user twice`()
    {
        sut.addUser(TEST_EMAIL, "testpassword")

        Assertions.assertThatThrownBy { sut.addUser(TEST_EMAIL, "testpassword") }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("User already exists")

    }

    @Test
    fun `cannot remove nonexistent user`()
    {
        Assertions.assertThatThrownBy{ sut.removeUser("notaperson.@email.com") }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("User does not exist")

    }
}