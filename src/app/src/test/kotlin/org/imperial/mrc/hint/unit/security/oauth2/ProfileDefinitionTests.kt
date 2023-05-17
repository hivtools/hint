package org.imperial.mrc.hint.unit.security.oauth2

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.scribejava.core.model.OAuth2AccessToken
import com.nhaarman.mockito_kotlin.mock
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.security.oauth2.ProfileDefinition
import org.junit.jupiter.api.Test
import com.nhaarman.mockito_kotlin.doReturn
import org.junit.jupiter.api.Assertions.assertEquals
import org.pac4j.oauth.config.OAuthConfiguration

class ProfileDefinitionTests
{
    @Test
    fun `can retrieve access token and user profile url`()
    {
        val mockToken = mock<OAuth2AccessToken>
        {
            on { accessToken } doReturn "token123"
        }

        val mockOAuthConfig = mock<OAuthConfiguration>()

        val sut = ProfileDefinition(mock(), ConfiguredAppProperties())

        val userInfoUrl = sut.getProfileUrl(mockToken, mockOAuthConfig)

        assertEquals(userInfoUrl, "https://fakeUrl/userinfo")

        assertEquals(sut.getToken(), "token123")
    }

    @Test
    fun `can extract user profile attributes`()
    {
        val objectMapper = ObjectMapper()

        val sut = ProfileDefinition(mock(), ConfiguredAppProperties(), objectMapper)

        val body = mapOf("email" to "james@example.com")

        val userProfile = sut.extractUserProfile(objectMapper.writeValueAsString(body))

        assertEquals(userProfile.id, "james@example.com")
    }
}

