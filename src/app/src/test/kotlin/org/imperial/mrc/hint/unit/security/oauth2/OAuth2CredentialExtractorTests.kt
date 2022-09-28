package org.imperial.mrc.hint.unit.security.oauth2

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.helpers.TranslationAssert.Companion.assertThatThrownBy
import org.imperial.mrc.hint.security.oauth2.OAuth2CredentialExtractor
import org.imperial.mrc.hint.security.oauth2.OAuth2StateGenerator
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyString
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.oauth.client.OAuth20Client
import org.pac4j.oauth.config.OAuth20Configuration
import org.pac4j.oauth.credentials.OAuth20Credentials
import java.util.*

class OAuth2CredentialExtractorTests
{
    @Test
    fun `throws userException when state parameter is not present`()
    {
        val mockContext = mock<WebContext>()

        val mockSession = mock<SessionStore>()

        val mockConfig = mock<OAuth20Configuration>()

        val mockOAuth20Client = mock<OAuth20Client> {
            on { configuration } doReturn mockConfig
        }

        val sut = OAuth2CredentialExtractor(mockConfig, mockOAuth20Client)

        assertThatThrownBy { sut.extract(mockContext, mockSession) }
            .isInstanceOf(HintException::class.java)
            .hasMessageContaining("Auth0 state parameter must be provided")
    }

    @Test
    fun `throws userException when state parameter does not match stored state`()
    {
        val encodedState =  Base64.getEncoder().encodeToString("injectedState".toByteArray())

        val mockContext = mock<WebContext> {
            on { getRequestParameter(anyString()) } doReturn Optional.of(encodedState)
        }

        val mockSession = mock<SessionStore>()

        val mockConfig = mock<OAuth20Configuration> {
            on { customParams } doReturn mapOf("state" to OAuth2StateGenerator.plaintextState())
        }

        val mockOAuth20Client = mock<OAuth20Client> {
            on { configuration } doReturn mockConfig
        }

        val sut = OAuth2CredentialExtractor(mockConfig, mockOAuth20Client)

        assertThatThrownBy { sut.extract(mockContext, mockSession) }
            .isInstanceOf(HintException::class.java)
            .hasMessageContaining("Auth0 State parameter mismatch possible threat of cross-site request forgery")
    }

    @Test
    fun `can validates auth0 credential`()
    {
        val mockContext = mock<WebContext> {
            on { getRequestParameter(anyString()) } doReturn Optional.of(OAuth2StateGenerator.encodedState())
        }

        val mockSession = mock<SessionStore>()

        val mockConfig = mock<OAuth20Configuration> {
            on { customParams } doReturn mapOf("state" to OAuth2StateGenerator.plaintextState())
        }

        val mockOAuth20Client = mock<OAuth20Client> {
            on { configuration } doReturn mockConfig
        }

        val sut = OAuth2CredentialExtractor(mockConfig, mockOAuth20Client)

        val extract = sut.extract(mockContext, mockSession)

        assertEquals(extract, Optional.of(OAuth20Credentials(OAuth2StateGenerator.encodedState())))
    }
}