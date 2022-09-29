package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.pac4j.core.config.Config
import org.pac4j.core.context.session.SessionStore
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Assertions.assertTrue
import org.pac4j.core.context.WebContext
import java.util.*

class SessionTests
{
    @Test
    fun `generates a version id`()
    {
        val sut = Session(mock(), mock(), mock())
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
        val sut = Session(mockWebContext, mockConfig, mockSessionStore)
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
        val sut = Session(mockWebContext, mockConfig, mockSessionStore)
        val versionId = sut.getVersionId()
        UUID.fromString(versionId)

        verify(mockSessionStore).set(mockWebContext, "version_id", versionId)
    }

    @Test
    fun `setMode saves new mode and clears version id if mode has changed`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore> {
            on { get(mockWebContext, "mode") } doReturn Optional.of("naomi")
        }
        val mockConfig = mock<Config>
        {
            on { sessionStore } doReturn mockSessionStore
        }

        val sut = Session(mockWebContext, mockConfig, mockSessionStore)
        sut.setMode("explore")

        verify(mockSessionStore).set(mockWebContext, "mode", "explore")
        verify(mockSessionStore).set(mockWebContext, "version_id", null)
    }

    @Test
    fun `setMode does nothing if mode has not changed`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore> {
            on { get(mockWebContext, "mode") } doReturn Optional.of("naomi")
        }
        val mockConfig = mock<Config>
        {
            on { sessionStore } doReturn mockSessionStore
        }

        val sut = Session(mockWebContext, mockConfig, mockSessionStore)
        sut.setMode("naomi")

        verify(mockSessionStore, never()).set(any(), any(), any())
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

        val sut = Session(mockWebContext, mockConfig, mockSessionStore)
        sut.setRequestedUrl("explore")

        verify(mockSessionStore).set(mockWebContext, "pac4jRequestedUrl", "explore")
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

        val sut = Session(mockWebContext, mockConfig, mockSessionStore)
        sut.setRequestedUrl(null)

        verify(mockSessionStore).set(mockWebContext, "pac4jRequestedUrl", null)
    }

    @Test
    fun`can generate oauth2 state parameter`()
    {
        val mockWebContext = mock<WebContext>()

        val mockSessionStore = mock<SessionStore>()

        val mockConfig = mock<Config>()

        val sut = Session(mockWebContext, mockConfig, mockSessionStore)

        assertTrue(sut.generateStateParameter().isNotEmpty())
    }
}
