package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.clients.ADRFuelClient
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile

class ADRClientBuilderTests
{

    private val encryption = Encryption()
    private val mockSession = mock<Session> {
        on { getUserProfile() } doReturn CommonProfile().apply { id = TEST_EMAIL }
        on { getAccessToken() } doReturn "FAKE_TOKEN"
    }
    private val mockRepo = mock<UserRepository> {
        on { getADRKey(TEST_EMAIL) } doReturn encryption.encrypt(TEST_KEY)
    }

    companion object
    {
        const val TEST_EMAIL = "test@test.com"
        const val TEST_KEY = "123"
    }

    @Test
    fun `throws error if user does not have a key`()
    {
        Assertions.assertThatThrownBy {
            ADRClientBuilder(ConfiguredAppProperties(), encryption, mockSession, mock(), mock())
                    .build()
        }.isInstanceOf(UserException::class.java)
    }

    @Test
    fun `build basic client with correct auth header`()
    {
        val sut = ADRClientBuilder(ConfiguredAppProperties(), encryption, mockSession, mockRepo, mock())
        val result = sut.build() as ADRFuelClient
        val headers = result.standardHeaders()
        Assertions.assertThat(headers["Authorization"]).isEqualTo(TEST_KEY)
        Assertions.assertThat(result.httpRequestHeaders()).isEqualTo(arrayOf("Authorization", TEST_KEY))
    }

    @Test
    fun `build sso client with correct auth header`()
    {
        val sut = ADRClientBuilder(
            ConfiguredAppProperties(),
            encryption,
            mockSession,
            mockRepo,
            mock()
        )
        val result = sut.buildSSO() as ADRFuelClient
        val headers = result.standardHeaders()
        Assertions.assertThat(headers["Authorization"]).isEqualTo("Bearer FAKE_TOKEN")
        Assertions.assertThat(result.httpRequestHeaders()).isEqualTo(arrayOf("Authorization", "Bearer FAKE_TOKEN"))
    }

}
