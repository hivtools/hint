package org.imperial.mrc.hint.unit.security

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.pac4j.core.config.Config
import org.pac4j.core.context.session.SessionStore
import org.imperial.mrc.hint.security.Session
import org.pac4j.core.context.WebContext
import java.util.*

class SessionTests
{
    @Test
    fun `generates a version id`()
    {
        val sut = Session(mock(), mock())
        val versionId = sut.generateVersionId()

        // throws exception if not a valid uuid
        UUID.fromString(versionId)
    }

    @Test
    fun `get version id gets existing version id`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore<WebContext>>
        {
            on { get(mockWebContext, "version_id") } doReturn "testVersionId"
        }
        val mockConfig = mock<Config>
        {
            on { sessionStore } doReturn mockSessionStore
        }
        val sut = Session(mockWebContext, mockConfig)
        val versionId = sut.getVersionId()
        assertThat(versionId).isEqualTo("testVersionId")
    }

    @Test
    fun `get version id generates a new version id if none present`()
    {
        val mockWebContext = mock<WebContext>()
        val mockSessionStore = mock<SessionStore<WebContext>>()
        val mockConfig = mock<Config>
        {
            on {sessionStore} doReturn mockSessionStore
        }
        val sut = Session(mockWebContext, mockConfig)
        val versionId = sut.getVersionId()
        UUID.fromString(versionId)

        verify(mockSessionStore).set(mockWebContext, "version_id", versionId)
    }
}

