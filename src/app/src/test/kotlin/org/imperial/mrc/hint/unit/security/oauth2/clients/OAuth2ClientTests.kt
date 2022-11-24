package org.imperial.mrc.hint.unit.security.oauth2.clients

import com.nhaarman.mockito_kotlin.mock
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.oauth2.clients.OAuth2Client
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class OAuth2ClientTests
{
    @Test
    fun `can configure Oauth2 client`()
    {
        val mockRepo = mock<UserRepository>()

        val sut = OAuth2Client(mockRepo)

        val oAuth2Client = sut.hintIndirectClient()

        assertEquals(oAuth2Client.name, "oauth2Client")

        assertEquals(oAuth2Client.callbackUrl, "http://localhost:8080/callback/oauth2Client")

        assertEquals(oAuth2Client.configuration.key, "fakeId")

        assertEquals(oAuth2Client.configuration.secret, "fakeSecret")

        assertEquals(oAuth2Client.configuration.responseType, "code")
    }
}
