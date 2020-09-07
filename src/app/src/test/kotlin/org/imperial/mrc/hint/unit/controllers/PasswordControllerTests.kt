package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.controllers.PasswordController
import org.imperial.mrc.hint.controllers.TokenException
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.emails.PasswordEmailTemplate
import org.imperial.mrc.hint.helpers.TranslationAssert
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.toJsonString
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.springframework.ui.ConcurrentModel

class PasswordControllerTests {

    val mockUser = mock<CommonProfile> {
        on { username } doReturn "test.user"
    }

    val mockUserRepo = mock<UserLogic> {
        on { getUser("test.user@test.com") } doReturn mockUser
    }

    val mockEmailManager = mock<EmailManager>()

    val expectedSuccessResponse = SuccessResponse(true).toJsonString()

    private val mockProps = mock<AppProperties> {
        on {applicationTitle} doReturn "AppTitle"
    }
    @Test
    fun `forgotPassword returns expected template name`() {
        val sut = PasswordController(mockProps, mockUserRepo, mock(), mockEmailManager)
        val model = ConcurrentModel()
        val result = sut.forgotPassword(model)
        assertThat(result).isEqualTo("forgot-password")
        assertThat(model["title"]).isEqualTo("AppTitle")
    }

    @Test
    fun `requestResetLink gets user and sends password reset email`() {
        val mockTokenMan = mock<OneTimeTokenManager> {
            on { generateOnetimeSetPasswordToken(mockUser.username) } doReturn "testToken"
        }

        val sut = PasswordController(mockProps, mockUserRepo, mockTokenMan, mockEmailManager)

        val result = sut.requestResetLink("test.user@test.com")

        assertThat(result).isEqualTo(expectedSuccessResponse)
        verify(mockEmailManager).sendPasswordEmail(
                eq("test.user@test.com"),
                eq("test.user"),
                argWhere { it is PasswordEmailTemplate.ResetPassword })
    }

    @Test
    fun `requestResetLink does not generate token if user does not exist`() {
        val mockTokenMan = mock<OneTimeTokenManager> {
            on { generateOnetimeSetPasswordToken(mockUser.username) } doReturn "token"
        }

        val sut = PasswordController(mockProps, mockUserRepo, mockTokenMan, mockEmailManager)

        val result = sut.requestResetLink("nonexistent@test.com")

        verify(mockTokenMan, never()).generateOnetimeSetPasswordToken(any())
        assertThat(result).isEqualTo(expectedSuccessResponse)
    }

    @Test
    fun `getResetPassword returns expected template and model`() {
        val sut = PasswordController(mockProps, mockUserRepo, mock(), mockEmailManager)
        val model = ConcurrentModel()
        val result = sut.getResetPassword("testToken", model)
        assertThat(result).isEqualTo("reset-password")
        assertThat(model["token"]).isEqualTo("testToken")
        assertThat(model["title"]).isEqualTo("AppTitle")
    }

    @Test
    fun `postResetPassword validates password and updates password`() {
        val mockProfile = mock<CommonProfile>()

        val mockTokenMan = mock<OneTimeTokenManager> {
            on { validateToken("testToken") } doReturn mockProfile
        }

        val sut = PasswordController(mockProps, mockUserRepo, mockTokenMan, mockEmailManager)

        val result = sut.postResetPassword("testToken", "testPassword")

        verify(mockTokenMan).validateToken("testToken")
        verify(mockUserRepo).updateUserPassword(mockProfile, "testPassword")

        assertThat(result).isEqualTo(expectedSuccessResponse)
    }

    @Test
    fun `postResetPassword throws error and does not update password if token is not valid`() {
        val mockTokenMan = mock<OneTimeTokenManager> {
            on { validateToken("testToken") } doReturn (null as CommonProfile?)
        }

        val sut = PasswordController(mockProps, mockUserRepo, mockTokenMan, mockEmailManager)

        TranslationAssert.assertThatThrownBy { sut.postResetPassword("testToken", "testPassword") }
                .isInstanceOf(TokenException::class.java)
                .hasTranslatedMessage("Token is not valid.")

        verify(mockTokenMan).validateToken("testToken")
        verify(mockUserRepo, never()).updateUserPassword(any(), any())
    }
}
