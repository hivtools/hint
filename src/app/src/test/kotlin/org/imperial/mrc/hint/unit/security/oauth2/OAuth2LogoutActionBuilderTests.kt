package org.imperial.mrc.hint.unit.security.oauth2

import com.nhaarman.mockito_kotlin.mock
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.security.oauth2.OAuth2LogoutActionBuilder
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.pac4j.jee.context.JEEContext

class OAuth2LogoutActionBuilderTests
{
    private val logoutUrl = "https://fakeUrl/v2/logout?client_id=fakeId&returnTo=http://localhost:8080/login"

    @Test
    fun `can logout and redirect to login page when login with auth0`()
    {
        val sut = OAuth2LogoutActionBuilder(ConfiguredAppProperties(), mock())

        assertEquals(sut.oauth2LogoutRedirect(), logoutUrl)
    }

    @Test
    fun `can return redirect action when login with auth0`()
    {
        val sut = OAuth2LogoutActionBuilder(ConfiguredAppProperties(), mock())

        val context = mock<JEEContext>()

        val redirectionAction = sut.getLogoutAction(context, mock(), mock(), "").get()

        assertEquals(redirectionAction.code, 302)

        assertTrue(redirectionAction.toString().contains(logoutUrl))
    }
}
