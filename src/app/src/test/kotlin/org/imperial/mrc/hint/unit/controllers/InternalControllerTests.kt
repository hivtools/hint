package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.controllers.InternalController
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus

class InternalControllerTests
{
    @Test
    fun `whoami returns only the user as a header`()
    {
        val profile = CommonProfile().apply { id = "test.user@example.com" }
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn profile
        }

        val result = InternalController(mockSession).whoami()

        assertThat(result.statusCode).isEqualTo(HttpStatus.NO_CONTENT)
        assertThat(result.headers["X-Hint-User"]).containsExactly("test.user@example.com")
        assertThat(result.headers["X-Hint-Version-Id"]).isNull()
        assertThat(result.body).isNull()
    }
}
