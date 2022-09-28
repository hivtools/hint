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
import org.imperial.mrc.hint.helpers.readPropsFromTempFile
import org.imperial.mrc.hint.security.oauth2.OAuth2State
import org.junit.jupiter.api.Assertions.assertEquals
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.net.URI

class LoginControllerTests
{
    @Test
    fun `can get login view and model with no query string`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest>()
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties(), mock())

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
            on { this.getParameter("username") } doReturn "testUser"
            on { this.getParameter("error") } doReturn "CredentialsException"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties(), mock())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("testUser")
        Assertions.assertThat(model["error"]).isEqualTo("Username or password is incorrect")
    }

    @Test
    fun `can get login error query string parameters`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { this.getParameter("message") } doReturn "Some user message"
            on { this.getParameter("error") } doReturn "SessionExpired"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties(), mock())

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
            on { this.getParameter("error") } doReturn "SessionExpired"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties(), mock())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("")
        Assertions.assertThat(model["error"]).isEqualTo("Your session expired. Please log in again")
    }

    @Test
    fun `sets redirect url if present and sets appTitle to Naomi Data Exploration`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest> {
            on { this.getParameter("redirectTo") } doReturn "explore"
        }
        val mockSession = mock<Session>()
        val sut = LoginController(mockRequest, mockSession, ConfiguredAppProperties(), mock())

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
        val sut = LoginController(mockRequest, mockSession, ConfiguredAppProperties(), mock())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["appTitle"]).isEqualTo("Naomi")
        verify(mockSession).setRequestedUrl(null)
    }

    @Test
    fun `login can redirect to auth0 tenant`()
    {
        val props = readPropsFromTempFile("oauth2_login_method=true")
        val appProperties = ConfiguredAppProperties(props)

        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest>()
        val mockStateCode = mock<OAuth2State> {
            on { generateCode() } doReturn "xyz"
        }
        val sut = LoginController(mockRequest, mock(), appProperties, mockStateCode)

        val result = sut.login(model) as ResponseEntity<*>

        val httpHeader = HttpHeaders()
        httpHeader.location = URI(
            "https://fakeUrl/authorize?response_type=code&client_id=fakeId&" +
                    "state=xyz&" +
                    "scope=openid+profile+email+read:dataset&audience=naomi&" +
                    "redirect_uri=http://localhost:8080/callback/oauth2Client"
        )

        assertEquals(result.statusCode, HttpStatus.SEE_OTHER)
        assertEquals(result.headers.location, httpHeader.location)
    }
}
