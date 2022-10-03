package org.imperial.mrc.hint.unit.security.oauth2

import org.imperial.mrc.hint.caseInsensitiveEmail
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.oauth2.OAuth2UserLogic
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
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
class OAuth2UserLogicServiceTests
{
    @Autowired
    private lateinit var sut: UserRepository

    @Autowired
    private lateinit var loginService: OAuth2UserLogic

    private val testEmail = "oauth@test.com"

    @BeforeEach
    fun`add test user`()
    {
        sut.addOAuth2User(testEmail)
    }

    @Test
    fun `can add new auth0 user`()
    {
        val newUser = "newTestEmail@example.com"

        loginService.validateUser(newUser)

        val existingUsers = sut.getAllUserNames()

        val savedUser = existingUsers
            .find { caseInsensitiveEmail(newUser).matches(it) }

        assertEquals(existingUsers.size, 3)

        assertEquals(savedUser, newUser)
    }

    @Test
    fun `does not add new user when matching existing user with auth2 user`()
    {
        loginService.validateUser(testEmail)

        val existingUsers = sut.getAllUserNames()

        val savedUser = existingUsers
            .find { caseInsensitiveEmail(testEmail).matches(it) }

        assertEquals(existingUsers.size, 2)

        assertEquals(savedUser, testEmail)
    }
}
