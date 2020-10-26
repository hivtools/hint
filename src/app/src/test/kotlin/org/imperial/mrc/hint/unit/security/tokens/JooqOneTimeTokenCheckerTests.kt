package org.imperial.mrc.hint.unit.security.tokens

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.TokenRepository
import org.imperial.mrc.hint.security.tokens.JooqOneTimeTokenChecker
import org.junit.jupiter.api.Test

class JooqOneTimeTokenCheckerTests
{
    @Test
    fun `Calls tokenRepo validateOneTimeToken`()
    {
        val mockRepo = mock<TokenRepository> {
            on { validateOneTimeToken("testToken") } doReturn true
        }

        val sut = JooqOneTimeTokenChecker(mockRepo)
        val result = sut.checkToken("testToken")
        assertThat(result).isTrue()
        verify(mockRepo).validateOneTimeToken("testToken")

    }
}