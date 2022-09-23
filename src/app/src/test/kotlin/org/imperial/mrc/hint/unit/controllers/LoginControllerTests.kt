package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.controllers.LoginController
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.springframework.ui.ConcurrentModel
import javax.servlet.http.HttpServletRequest
import org.imperial.mrc.hint.ConfiguredAppProperties

class LoginControllerTests
{
    @Test
    fun `can get login view and model with no query string`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest>()
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("")
        Assertions.assertThat(model["error"]).isEqualTo("")
        Assertions.assertThat(model["continueTo"]).isEqualTo("/")
    }

    @Test
    fun `can get login view and model query string parameters`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("username") } doReturn "testUser"
            on { getParameter("error") } doReturn "CredentialsException"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("testUser")
        Assertions.assertThat(model["error"]).isEqualTo("Username or password is incorrect")
    }

    @Test
    fun `can get French translation for incorrect login error`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("username") } doReturn "testUser"
            on { getParameter("error") } doReturn "CredentialsException"
            on { getHeader("Accept-Language") } doReturn "fr"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)
        
        Assertions.assertThat(model["error"]).isEqualTo("Le nom d'utilisateur ou le mot de passe est incorrect")
    }

    @Test
    fun `can get Portuguese translation for incorrect login error`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("username") } doReturn "testUser"
            on { getParameter("error") } doReturn "CredentialsException"
            on { getHeader("Accept-Language") } doReturn "pt"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)
        
        Assertions.assertThat(model["error"]).isEqualTo("O nome de utilizador ou palavra-passe está incorreto")
    }

    @Test
    fun `can get login error query string parameters`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("message") } doReturn "Some user message"
            on { getParameter("error") } doReturn "SessionExpired"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("")
        Assertions.assertThat(model["error"]).isEqualTo("Some user message")
    }

    @Test
    fun `can get default error message without message query string parameter`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("error") } doReturn "SessionExpired"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("")
        Assertions.assertThat(model["error"]).isEqualTo("Your session has expired. Please log in again.")
    }

    @Test
    fun `can get French translation for session expired error`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("error") } doReturn "SessionExpired"
            on { getHeader("Accept-Language") } doReturn "fr"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)
        
        Assertions.assertThat(model["error"]).isEqualTo("Votre session a expiré. Veuillez vous reconnecter.")
    }

    @Test
    fun `can get Portuguese translation for session expired error`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("error") } doReturn "SessionExpired"
            on { getHeader("Accept-Language") } doReturn "pt"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)
        
        Assertions.assertThat(model["error"]).isEqualTo("A sua sessão expirou. Por favor, inicie sessão novamente.")
    }

    @Test
    fun `sets redirect url if present and sets appTitle to Naomi Data Exploration`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("redirectTo") } doReturn "explore"
        }
        val mockSession = mock<Session>()
        val sut = LoginController(mockRequest, mockSession, ConfiguredAppProperties())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["appTitle"]).isEqualTo("Naomi Data Exploration")
        Assertions.assertThat(model["continueTo"]).isEqualTo("explore")
        verify(mockSession).setRequestedUrl("explore")
    }

    @Test
    fun `sets redirect url to null if not present and sets appTitle to Naomi`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest>()
        val mockSession = mock<Session>()
        val sut = LoginController(mockRequest, mockSession, ConfiguredAppProperties())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["appTitle"]).isEqualTo("Naomi")
        verify(mockSession).setRequestedUrl(null)
    }
}
