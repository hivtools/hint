package org.imperial.mrc.hint.unit.security.oauth2

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

        val sut = ProfileDefinition(ConfiguredAppProperties())

        val userInfoUrl = sut.getProfileUrl(mockToken, mockOAuthConfig)

        assertEquals(userInfoUrl, "https://fakeUrl/userinfo")

        assertEquals(ProfileDefinition.token, "token123")
    }

    @Test
    fun `can extract user profile attributes`()
    {
        val sut = ProfileDefinition(ConfiguredAppProperties())

        val userProfile = sut.extractUserProfile("")

        assertEquals(userProfile.id, "test.user@example.com")
    }
}

