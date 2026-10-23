package org.imperial.mrc.hint.unit

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.clients.ADRFuelClient
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

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
    }

    @Test
    fun `add log message if user does not have access token`()
    {
        val mockSession = mock<Session> {
            on { getAccessToken() } doReturn ""
        }

        val mockLogger = mock<GenericLogger>()

        val sut = ADRClientBuilder(
            ConfiguredAppProperties(),
            encryption,
            mockSession,
            mockRepo,
            mockLogger
        )

        val result = sut.buildSSO() as ADRFuelClient
        val headers = result.standardHeaders()
        verify(mockLogger).info("There was a problem retrieving access token from Auth0")
        Assertions.assertThat(headers["Authorization"]).isEqualTo("Bearer ")
    }

    @Test
    fun `does not log the access token`()
    {
        val logger = RecordingLogger()
        val sut = ADRClientBuilder(ConfiguredAppProperties(), encryption, mockSession, mockRepo, logger)

        sut.buildSSO()

        Assertions.assertThat(logger.messages).noneMatch { it.contains("FAKE_TOKEN") }
    }

    private class RecordingLogger : GenericLogger
    {
        val messages = mutableListOf<String>()

        override fun info(action: String)
        {
            messages.add(action)
        }

        override fun info(action: String, request: HttpServletRequest, user: String?)
        {
            messages.add(action)
        }

        override fun <K, V> info(message: String, additionalData: Map<K, V>?)
        {
            messages.add("$message $additionalData")
        }

        override fun error(request: HttpServletRequest, response: HttpServletResponse, message: String?) {}

        override fun error(request: HttpServletRequest, error: Throwable?, status: HttpStatus) {}

        override fun error(request: HttpServletRequest, error: HintException) {}

        override fun <K, V> error(message: String, additionalData: Map<K, V>?) {}
    }

}
