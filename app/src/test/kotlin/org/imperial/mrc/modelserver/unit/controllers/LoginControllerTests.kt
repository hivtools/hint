package org.imperial.mrc.modelserver.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import org.junit.jupiter.api.Test
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.modelserver.controllers.LoginController
import org.springframework.ui.ConcurrentModel
import javax.servlet.http.HttpServletRequest

class LoginControllerTests
{
    @Test
    fun `can get login view and model with no query string`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest>()
        val sut = LoginController(mockRequest)

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("")
        Assertions.assertThat(model["error"]).isEqualTo("")
    }

    @Test
    fun `can get login view and model query string parameters`()
    {
        val model = ConcurrentModel()
        val mockRequest = mock<HttpServletRequest>{
            on { this.getParameter("username") } doReturn "testUser"
            on { this.getParameter("error") } doReturn "CredentialsException"
        }
        val sut = LoginController(mockRequest)

        val result = sut.login(model)

        Assertions.assertThat(result).isEqualTo("login")
        Assertions.assertThat(model["title"]).isEqualTo("Login")
        Assertions.assertThat(model["username"]).isEqualTo("testUser")
        Assertions.assertThat(model["error"]).isEqualTo("Username or password is incorrect")
    }
}