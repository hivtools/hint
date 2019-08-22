package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.controllers.PasswordController
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile

class PasswordControllerTests {

    val mockUser = mock<CommonProfile>()

    val mockUserRepo = mock<UserRepository> {
        on { getUser("test.user@test.com") } doReturn mockUser
    }

    @Test
    fun `requestResetLink gets user and generates Token`()
    {
        val mockTokenGen = mock<OneTimeTokenManager> {
            on { generateOnetimeSetPasswordToken( mockUser ) } doReturn "token"
        }

        val sut = PasswordController(mockUserRepo, mockTokenGen)

        val result = sut.requestResetLink("test.user@test.com")

        verify(mockTokenGen).generateOnetimeSetPasswordToken(mockUser)

        //TODO: we won't always return the token, but test it's got it ok for now, change once we can save it
        assertThat(result).isEqualTo("token")
    }

    @Test
    fun `requestResetLink does not generate token if user does not exist`()
    {
        val mockTokenGen = mock<OneTimeTokenManager> {
            on { generateOnetimeSetPasswordToken( mockUser ) } doReturn "token"
        }

        val sut = PasswordController(mockUserRepo, mockTokenGen)

        val result = sut.requestResetLink("nonexistent@test.com")

        verify(mockTokenGen, never()).generateOnetimeSetPasswordToken(any())
        assertThat(result).isEqualTo("")
    }
}