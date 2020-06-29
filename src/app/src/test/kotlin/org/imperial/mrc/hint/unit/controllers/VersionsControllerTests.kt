package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import org.imperial.mrc.hint.controllers.VersionsController
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.models.Snapshot
import org.pac4j.core.profile.CommonProfile

class VersionsControllerTests {
    @Test
    fun `creates new version`()
    {
        val mockProfile = mock<CommonProfile> {
            on { id } doReturn "testUser"
        }

        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn mockProfile
            on { generateNewSnapshotId() } doReturn "testSnapshot"
        }

        val snapshot = Snapshot("testSnapshot", "createdTime", "updatedTime")
        val mockSessionRepo = mock<SessionRepository> {
            on { getSessionSnapshot("testSnapshot", "testUser") } doReturn snapshot
        }

        val mockVersionRepo = mock<VersionRepository> {
            on { saveNewVersion("testUser", "testVersion") } doReturn 99
        }

        val sut = VersionsController(mockSession, mockSessionRepo, mockVersionRepo)

        val request = mapOf("name" to "testVersion")
        val result = sut.newVersion(request)

        verify(mockSessionRepo).saveSession("testSnapshot", "testUser", 99)

        val parser = ObjectMapper()
        val resultJson = parser.readTree(result.body)["data"]

        assertThat(resultJson["id"].asInt()).isEqualTo(99)
        assertThat(resultJson["name"].asText()).isEqualTo("testVersion")
        val snapshots = resultJson["snapshots"] as ArrayNode
        assertThat(snapshots.count()).isEqualTo(1)
        assertThat(snapshots[0]["id"].asText()).isEqualTo("testSnapshot")
        assertThat(snapshots[0]["created"].asText()).isEqualTo("createdTime")
        assertThat(snapshots[0]["updated"].asText()).isEqualTo("updatedTime")
    }
}
