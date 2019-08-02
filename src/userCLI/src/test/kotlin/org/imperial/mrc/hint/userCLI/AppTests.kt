package org.imperial.mrc.hint.userCLI

import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.db.UserRepository
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationContext
import org.springframework.transaction.annotation.Isolation


//The hint db container must be running to run these tests
@ActiveProfiles(profiles=["test"])
@SpringBootTest
@ExtendWith(SpringExtension::class)
@Transactional(isolation= Isolation.READ_UNCOMMITTED)
open class AppTests
{
    companion object {
        const val TEST_EMAIL = "test@test.com"
    }

    @Autowired
    private lateinit var context: ApplicationContext

    @Test
    //@Transactional
    open fun `can add user`()
    {
        val sut = UserCLI(context)
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        sut.removeUser(mapOf("<email>" to TEST_EMAIL))
    }

    @Test
    //@Transactional(isolation= Isolation.READ_UNCOMMITTED)
    open fun `can remove user`()
    {
        val sut = UserCLI(context)
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        sut.removeUser(mapOf("<email>" to TEST_EMAIL))

    }

    @Test
    open fun `cannot add same user twice`()
    {
        val sut = UserCLI(context)
        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))

        sut.addUser(mapOf("<email>" to TEST_EMAIL, "<password>" to "testpassword"))
    }
}