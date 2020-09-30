package org.imperial.mrc.hint.database

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.security.HintDbProfileService
import org.junit.jupiter.api.Test
import org.pac4j.core.context.WebContext
import org.pac4j.core.credentials.UsernamePasswordCredentials
import org.pac4j.core.exception.AccountNotFoundException
import org.pac4j.core.exception.BadCredentialsException
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@Transactional
class HintDbProfileServiceTests
{
    private val mockContext = mock<WebContext> {}

    @Autowired
    private lateinit var sut: HintDbProfileService

    @Test
    fun `throws BadCredentialsException if username is blank`()
    {
        val credentials = mock<UsernamePasswordCredentials> {
            on { getUsername() } doReturn ""
            on { getPassword() } doReturn "password"
        }

        assertThatThrownBy { sut.validate(credentials, mockContext) }.isInstanceOf(BadCredentialsException::class.java)
                .hasMessage("Username and password must be provided")

    }

    @Test
    fun `throws BadCredentialsException if password is blank`()
    {
        val credentials = mock<UsernamePasswordCredentials> {
            on { getUsername() } doReturn "username"
            on { getPassword() } doReturn ""
        }

        assertThatThrownBy { sut.validate(credentials, mockContext) }.isInstanceOf(BadCredentialsException::class.java)
                .hasMessage("Username and password must be provided")
    }

    @Test
    fun `validates as base class if username and password are both provided`()
    {
        val credentials = mock<UsernamePasswordCredentials> {
            on { getUsername() } doReturn "username"
            on { getPassword() } doReturn "password"
        }

        assertThatThrownBy { sut.validate(credentials, mockContext) }.isInstanceOf(AccountNotFoundException::class.java)
                .hasMessage("No account found for: username")
    }
}