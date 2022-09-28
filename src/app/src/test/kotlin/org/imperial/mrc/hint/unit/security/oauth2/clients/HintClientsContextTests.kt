package org.imperial.mrc.hint.unit.security.oauth2.clients

import com.nhaarman.mockito_kotlin.mock
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.security.oauth2.clients.HintClientsContext
import org.imperial.mrc.hint.security.oauth2.clients.OAuth2Client
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.pac4j.oauth.client.OAuth20Client
import org.pac4j.oauth.config.OAuth20Configuration

class HintClientsContextTests
{
    @Test
    fun `Hint context class can return pac4j OAuth20  client`()
    {
        val mockOAuth20Client = mock<OAuth20Client>()

        val mockOAuth20Config = mock<OAuth20Configuration>()

        val oauth2Client = OAuth2Client(ConfiguredAppProperties(), mockOAuth20Client, mockOAuth20Config, mock())

        val sut = HintClientsContext(oauth2Client)

        val result = sut.getIndirectClient()

        assertEquals(result, mockOAuth20Client)
    }
}
