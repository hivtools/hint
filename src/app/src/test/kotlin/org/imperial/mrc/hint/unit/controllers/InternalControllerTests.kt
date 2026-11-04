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
        assertThat(result.headers["X-Hint-Guest-Versions"]).isNull()
        assertThat(result.body).isNull()
    }

    @Test
    fun `whoami passes on the versions given to a guest`()
    {
        val profile = CommonProfile().apply { id = "guest" }
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn profile
            on { userIsGuest() } doReturn true
            on { getGuestVersionIds() } doReturn listOf("v1", "v2")
        }

        val result = InternalController(mockSession).whoami()

        assertThat(result.headers["X-Hint-User"]).containsExactly("guest")
        assertThat(result.headers["X-Hint-Guest-Versions"]).containsExactly("v1,v2")
    }

    @Test
    fun `whoami sends no guest versions for a guest who has none`()
    {
        val profile = CommonProfile().apply { id = "guest" }
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn profile
            on { userIsGuest() } doReturn true
            on { getGuestVersionIds() }.thenReturn(listOf<String>())
        }

        val result = InternalController(mockSession).whoami()

        assertThat(result.headers["X-Hint-Guest-Versions"]).isNull()
    }

    @Test
    fun `whoami never sends guest versions for a logged in user`()
    {
        val profile = CommonProfile().apply { id = "test.user@example.com" }
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn profile
            on { userIsGuest() } doReturn false
            on { getGuestVersionIds() } doReturn listOf("left-over-from-when-they-were-a-guest")
        }

        val result = InternalController(mockSession).whoami()

        assertThat(result.headers["X-Hint-Guest-Versions"]).isNull()
    }
}
