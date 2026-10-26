package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.controllers.GuestVersionController
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.models.Version
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.http.HttpStatus
import org.mockito.Mockito.verifyNoInteractions

class GuestVersionControllerTests
{
    @Test
    fun `creates a version with no project and records it against the guest session`()
    {
        val mockSession = mock<Session> {
            on { userIsGuest() } doReturn true
            on { generateVersionId() } doReturn "guestVersion"
        }
        val mockRepo = mock<VersionRepository> {
            on { getVersion("guestVersion") } doReturn Version("guestVersion", "created", "updated", 1)
        }
        val sut = GuestVersionController(mockSession, mockRepo)

        val result = sut.newGuestVersion()

        verify(mockRepo).saveVersion("guestVersion", null)
        verify(mockSession).addGuestVersionId("guestVersion")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val data = ObjectMapper().readTree(result.body)["data"]
        assertThat(data["id"].asText()).isEqualTo("guestVersion")
    }

    @Test
    fun `logged in users cannot create guest versions`()
    {
        val mockSession = mock<Session> {
            on { userIsGuest() } doReturn false
        }
        val mockRepo = mock<VersionRepository>()
        val sut = GuestVersionController(mockSession, mockRepo)

        val error = assertThrows<HintException> { sut.newGuestVersion() }

        assertThat(error.key).isEqualTo("guestsOnly")
        assertThat(error.httpStatus).isEqualTo(HttpStatus.FORBIDDEN)
        verifyNoInteractions(mockRepo)
    }
}
