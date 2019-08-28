package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.controllers.PasswordController
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.emails.PasswordResetEmail
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile

class PasswordControllerTests {

    val mockUser = mock<CommonProfile> {
    }

    val mockUserRepo = mock<UserRepository> {
        on { getUser("test.user@test.com") } doReturn mockUser
    }

    val mockAppProperties = mock<AppProperties> {
        on { applicationTitle } doReturn "testAppTitle"
        on { applicationUrl } doReturn "https://test/"
    }

    val mockEmailManager = mock<EmailManager>()

    @Test
    fun `forgotPassword returns expected template name`()
    {
        val sut = PasswordController(mockUserRepo,  mock(), mockAppProperties, mockEmailManager)
        val result = sut.forgotPassword()
        assertThat(result).isEqualTo("forgot-password")
    }

    @Test
    fun `requestResetLink gets user and generates Token`()
    {
        val mockTokenMan = mock<OneTimeTokenManager> {
            on { generateOnetimeSetPasswordToken( mockUser ) } doReturn "testToken"
        }

        val sut = PasswordController(mockUserRepo, mockTokenMan, mockAppProperties, mockEmailManager)

        val result = sut.requestResetLink("test.user@test.com")

        assertThat(result).isEqualTo("")

        verify(mockTokenMan).generateOnetimeSetPasswordToken(mockUser)

        argumentCaptor<PasswordResetEmail>().apply{
            verify(mockEmailManager).sendEmail(capture(), eq("test.user@test.com"))
            val emailObj = firstValue
            assertThat(emailObj).isInstanceOf(PasswordResetEmail::class.java)
            assertThat((emailObj as PasswordResetEmail).values["appTitle"]).isEqualTo("testAppTitle")
            assertThat(emailObj.values["appUrl"]).isEqualTo("https://test/")
            assertThat(emailObj.values["token"]).isEqualTo("testToken")
            assertThat(emailObj.values["email"]).isEqualTo("test.user@test.com")
        }

    }

    @Test
    fun `requestResetLink does not generate token if user does not exist`()
    {
        val mockTokenMan = mock<OneTimeTokenManager> {
            on { generateOnetimeSetPasswordToken( mockUser ) } doReturn "token"
        }

        val sut = PasswordController(mockUserRepo, mockTokenMan, mockAppProperties, mockEmailManager)

        val result = sut.requestResetLink("nonexistent@test.com")

        verify(mockTokenMan, never()).generateOnetimeSetPasswordToken(any())
        assertThat(result).isEqualTo("")
    }

    @Test
    fun `resetPassword validates password and updates password`()
    {
        val mockProfile = mock<CommonProfile>()

        val mockTokenMan = mock<OneTimeTokenManager>{
            on { validateToken("testToken") } doReturn mockProfile
        }

        val sut = PasswordController(mockUserRepo, mockTokenMan, mockAppProperties, mockEmailManager)

        val result = sut.postResetPassword("testToken", "testPassword")

        verify(mockTokenMan).validateToken("testToken")
        assertThat(result).isEqualTo("")
    }
}