package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import com.nhaarman.mockito_kotlin.whenever
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.InvalidVersionException
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.assertThrows
import org.pac4j.core.profile.CommonProfile
import org.pac4j.core.util.Pac4jConstants
import org.springframework.http.HttpStatus
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyString
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import java.util.*

class SessionTests
{
    @Test
    fun `generates a version id`()
    {
        val sut = Session(mock(), mock(), mock(), mock())
        val versionId = sut.generateVersionId()

        // throws exception if not a valid uuid
        UUID.fromString(versionId)
    }

    @Test
    fun `get version id gets existing version id`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore>{
            on { get(mockWebContext, "version_id") } doReturn Optional.of("testVersionId")
        }
        val mockConfig = mock<Config>
        {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = Session(mockWebContext, mockConfig, mockSessionStore, mock())
        val versionId = sut.getVersionId()
        assertThat(versionId).isEqualTo("testVersionId")
    }

    @Test
    fun `get version id generates a new version id if none present`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore>()
        val mockConfig = mock<Config>
        {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = Session(mockWebContext, mockConfig, mockSessionStore, mock())
        val versionId = sut.getVersionId()
        UUID.fromString(versionId)

        verify(mockSessionStore).set(mockWebContext, "version_id", versionId)
    }

    @Test
    fun `can set pac4j requested url to string value`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore>()
        val mockConfig = mock<Config>
        {
            on { sessionStore } doReturn mockSessionStore
        }

        val sut = Session(mockWebContext, mockConfig, mockSessionStore, mock())
        sut.setRequestedUrl("accessibility")

        verify(mockSessionStore).set(mockWebContext, "pac4jRequestedUrl", "accessibility")
    }

    @Test
    fun `can set pac4j requested url to null`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore>()
        val mockConfig = mock<Config>
        {
            on { sessionStore } doReturn mockSessionStore
        }

        val sut = Session(mockWebContext, mockConfig, mockSessionStore, mock())
        sut.setRequestedUrl(null)

        verify(mockSessionStore).set(mockWebContext, "pac4jRequestedUrl", null)
    }

    @Test
    fun`can generate oauth2 state parameter`()
    {
        val mockWebContext = mock<WebContext>()

        val mockSessionStore = mock<SessionStore>()

        val mockConfig = mock<Config>()

        val sut = Session(mockWebContext, mockConfig, mockSessionStore, mock())

        assertTrue(sut.generateStateParameter().isNotEmpty())

        verify(mockSessionStore).set(any(), anyString(), anyString())
    }

    @Test
    fun `gets empty string when token is empty`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore>()
        val mockConfig = mock<Config>()
        val sut = Session(mockWebContext, mockConfig, mockSessionStore, mock())
        val accessToken = sut.getAccessToken()
        assertThat(accessToken).isEqualTo("")
    }

    private fun sessionWithHeader(
        header: String?,
        userId: String?,
        versionRepository: VersionRepository = mock(),
        sessionValues: Map<String, Any> = mapOf()
    ): Session
    {
        val mockWebContext = mock<WebContext> {
            on { getRequestHeader("X-Version-Id") } doReturn Optional.ofNullable(header)
        }
        val mockSessionStore = mock<SessionStore>()
        sessionValues.forEach { (key, value) ->
            whenever(mockSessionStore.get(mockWebContext, key)).thenReturn(Optional.of(value))
        }
        if (userId != null)
        {
            val profile = CommonProfile().apply { id = userId }
            whenever(mockSessionStore.get(mockWebContext, Pac4jConstants.USER_PROFILES))
                .thenReturn(Optional.of(linkedMapOf("client" to profile)))
        }
        val mockConfig = mock<Config> {
            on { sessionStore } doReturn mockSessionStore
        }
        return Session(mockWebContext, mockConfig, mockSessionStore, versionRepository)
    }

    @Test
    fun `get version id uses the header when the user owns the version`()
    {
        val repo = mock<VersionRepository> {
            on { versionExists("headerVersion", "test.user@example.com") } doReturn true
        }
        val sut = sessionWithHeader("headerVersion", "test.user@example.com", repo,
            mapOf("version_id" to "sessionVersion"))

        assertThat(sut.getVersionId()).isEqualTo("headerVersion")
        assertThat(sut.getRequestedVersionId()).isEqualTo("headerVersion")
        assertThat(sut.getSessionVersionId()).isEqualTo("sessionVersion")
    }

    @Test
    fun `get version id throws if the user does not own the version in the header`()
    {
        val repo = mock<VersionRepository> {
            on { versionExists("headerVersion", "test.user@example.com") } doReturn false
        }
        val sut = sessionWithHeader("headerVersion", "test.user@example.com", repo,
            mapOf("version_id" to "sessionVersion"))

        val error = assertThrows<InvalidVersionException> { sut.getVersionId() }
        assertThat(error.httpStatus).isEqualTo(HttpStatus.FORBIDDEN)
        assertThat(error.errorCode).isEqualTo("INVALID_VERSION")
    }

    @Test
    fun `get version id for a guest accepts only versions given to that guest`()
    {
        val sut = sessionWithHeader("guestVersion", null, mock(),
            mapOf("guest_version_ids" to arrayListOf("other", "guestVersion")))
        assertThat(sut.getVersionId()).isEqualTo("guestVersion")

        val other = sessionWithHeader("notMine", null, mock(),
            mapOf("guest_version_ids" to arrayListOf("other", "guestVersion")))
        assertThrows<InvalidVersionException> { other.getVersionId() }
    }

    @Test
    fun `a guest cannot use the version stored in the session as a header`()
    {
        val sut = sessionWithHeader("sessionVersion", null, mock(), mapOf("version_id" to "sessionVersion"))
        assertThrows<InvalidVersionException> { sut.getVersionId() }
    }

    @Test
    fun `a blank version header is the same as no header`()
    {
        val sut = sessionWithHeader("  ", "test.user@example.com", mock(), mapOf("version_id" to "sessionVersion"))
        assertThat(sut.getRequestedVersionId()).isNull()
        assertThat(sut.getVersionId()).isEqualTo("sessionVersion")
    }

    @Test
    fun `can add guest version ids`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore> {
            on { get(mockWebContext, "guest_version_ids") } doReturn Optional.of(arrayListOf("first"))
        }
        val sut = Session(mockWebContext, mock(), mockSessionStore, mock())
        sut.addGuestVersionId("second")

        verify(mockSessionStore).set(mockWebContext, "guest_version_ids", arrayListOf("first", "second"))
    }
}
