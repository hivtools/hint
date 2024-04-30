package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.assertj.core.api.AssertionsForInterfaceTypes.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.controllers.LoginController
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.ui.ConcurrentModel
import java.net.URI
import javax.servlet.http.HttpServletRequest

class LoginControllerTests
{

    private val clientId = "fakeId"
    private val appUrl = "https://naomi.com"
    private val clientUrl = "oAuth2tenant.com"
    private val audience = "naomi"
    private val scope = "openid+profile+email+access:adr"

    private val mockProperties = mock<AppProperties> {
        on { oauth2ClientUrl } doReturn clientUrl
        on { applicationUrl } doReturn appUrl
        on { oauth2ClientId } doReturn clientId
        on { oauth2ClientAudience } doReturn audience
        on { oauth2ClientScope } doReturn scope
    }

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
            on { this.getParameter("username") } doReturn "testUser"
            on { this.getParameter("error") } doReturn "CredentialsException"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

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
            on { this.getParameter("error") } doReturn "SessionExpired"
        }
        val sut = LoginController(mockRequest, mock(), ConfiguredAppProperties())

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("")
        Assertions.assertThat(model["error"]).isEqualTo("Your session expired. Please log in again")
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

    @Test
    fun `can redirect to auth0 login page`()
    {
        /*
        val clientId = "fakeId"
        val appUrl = "https://naomi.com"
        val clientUrl = "oauth2tenant.com"
        val audience = "naomi"

        val mockProperties = mock<AppProperties>{
            on { oauth2ClientUrl } doReturn clientUrl
            on { applicationUrl } doReturn appUrl
            on { oauth2ClientId } doReturn clientId
            on { oauth2ClientAudience } doReturn audience
            on { oauth2LoginMethod } doReturn true
        }

         */

        val mockRequest = mock<HttpServletRequest>()

        val encodedState = "encodedStateCode"

        val mockSession = mock<Session>{
            on { generateStateParameter() } doReturn encodedState
        }

        val sut = LoginController(mockRequest, mockSession, mockProperties)

        val result = sut.loginRedirection()

        val httpHeader = HttpHeaders()

        httpHeader.location = URI(
            "https://$clientUrl/authorize?response_type=code&client_id=$clientId&" +
                    "state=$encodedState&" +
                    "scope=$scope&audience=$audience&" +
                    "redirect_uri=$appUrl/callback/oauth2Client"
        )

        assertEquals(result.statusCode, HttpStatus.SEE_OTHER)

        assertEquals(result.headers.location, httpHeader.location)
    }

    @Test
    fun `can redirect to auth0 signup page`()
    {
        /*
        val clientId = "fakeId"
        val appUrl = "https://naomi.com"
        val clientUrl = "oauth2tenant.com"
        val audience = "naomi"
        val scope = "openid+profile+email+access:adr"

        val mockProperties = mock<AppProperties>{
            on { oauth2ClientUrl } doReturn clientUrl
            on { applicationUrl } doReturn appUrl
            on { oauth2ClientId } doReturn clientId
            on { oauth2ClientAudience } doReturn audience
            on { oauth2LoginMethod } doReturn true
            on { oauth2ClientScope } doReturn scope
        }

         */

        val mockRequest = mock<HttpServletRequest>()

        val encodedState = "encodedStateCode"

        val mockSession = mock<Session>{
            on { generateStateParameter() } doReturn encodedState
        }

        val sut = LoginController(mockRequest, mockSession, mockProperties)

        val result = sut.registerRedirection()

        val httpHeader = HttpHeaders()

        httpHeader.location = URI(
            "https://$clientUrl/authorize?response_type=code&client_id=$clientId&" +
                    "state=$encodedState&" +
                    "scope=$scope&audience=$audience&" +
                    "redirect_uri=$appUrl/callback/oauth2Client&screen_hint=signup"
        )

        assertEquals(result.statusCode, HttpStatus.SEE_OTHER)

        assertEquals(result.headers.location, httpHeader.location)
    }

    @Test
    fun `can get sso login method`()
    {
        val mockRequest = mock<HttpServletRequest>()

        val mockSession = mock<Session>()

        val sut = LoginController(mockRequest, mockSession, ConfiguredAppProperties())

        val result = sut.isSSOLoginMethod()

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val resultJson = ObjectMapper().readTree(result.body)["data"]

        assertThat(resultJson.asBoolean()).isEqualTo(false)
    }
}
