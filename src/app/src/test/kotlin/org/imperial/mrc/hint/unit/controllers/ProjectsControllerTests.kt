package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import org.imperial.mrc.hint.controllers.ProjectsController
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.models.Snapshot
import org.imperial.mrc.hint.models.SnapshotDetails
import org.imperial.mrc.hint.models.SnapshotFile
import org.imperial.mrc.hint.models.Project
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus

class ProjectsControllerTests {
    private val mockProfile = mock<CommonProfile> {
        on { id } doReturn "testUser"
    }

    private val mockSession = mock<Session> {
        on { getUserProfile() } doReturn mockProfile
        on { generateNewSnapshotId() } doReturn "testSnapshot"
        on { userIsGuest() } doReturn false
    }

    private val mockSnapshot = Snapshot("testSnapshot", "createdTime", "updatedTime")

    private val parser = ObjectMapper()

    @Test
    fun `creates new version`()
    {
        val mockSnapshotRepo = mock<SnapshotRepository> {
            on { getSnapshot("testSnapshot") } doReturn mockSnapshot
        }

        val mockVersionRepo = mock<ProjectRepository> {
            on { saveNewProject("testUser", "testVersion") } doReturn 99
        }

        val sut = ProjectsController(mockSession, mockSnapshotRepo, mockVersionRepo)

        val result = sut.newVersion("testVersion")

        verify(mockSnapshotRepo).saveSnapshot("testSnapshot", 99)

        val resultJson = parser.readTree(result.body)["data"]

        assertThat(resultJson["id"].asInt()).isEqualTo(99)
        assertThat(resultJson["name"].asText()).isEqualTo("testVersion")
        val snapshots = resultJson["snapshots"] as ArrayNode
        assertThat(snapshots.count()).isEqualTo(1)
        assertExpectedSnapshot(snapshots[0])
    }

    @Test
    fun `copies snapshot`()
    {
        val mockSnapshotRepo = mock<SnapshotRepository> {
            on { getSnapshot("testSnapshot") } doReturn mockSnapshot
        }
        val sut = ProjectsController(mockSession, mockSnapshotRepo, mock())
        val result = sut.newSnapshot(99, "parentSnapshot")

        verify(mockSnapshotRepo).copySnapshot("parentSnapshot", "testSnapshot",99, "testUser" )

        val resultJson = parser.readTree(result.body)["data"]
        assertExpectedSnapshot(resultJson)
    }

    @Test
    fun `gets versions`()
    {
        val mockSnapshots = listOf(Snapshot("testSnapshot", "createdTime", "updatedTime"))
        val mockVersions = listOf(Project(99, "testVersion", mockSnapshots))
        val mockVersionRepo = mock<ProjectRepository>{
            on { getProjects("testUser") } doReturn mockVersions
        }

        val sut = ProjectsController(mockSession, mock(), mockVersionRepo)
        val result = sut.getVersions()

        val resultJson = parser.readTree(result.body)["data"]
        val versions = resultJson as ArrayNode
        assertThat(versions.count()).isEqualTo(1)
        assertThat(versions[0]["id"].asInt()).isEqualTo(99)
        assertThat(versions[0]["name"].asText()).isEqualTo("testVersion")
        val snapshots = versions[0]["snapshots"] as ArrayNode
        assertThat(snapshots.count()).isEqualTo(1)
        assertExpectedSnapshot(snapshots[0])
    }

    @Test
    fun `gets empty versions list if user is guest`()
    {
        val guestSession = mock<Session> {
            on { userIsGuest() } doReturn true
        }
        val sut = ProjectsController(guestSession, mock(), mock())
        val result = sut.getVersions()

        val resultJson = parser.readTree(result.body)["data"]
        val versions = resultJson as ArrayNode
        assertThat(versions.count()).isEqualTo(0)
    }

    @Test
    fun `can upload state`()
    {
        val mockRepo = mock<SnapshotRepository>();
        val sut = ProjectsController(mockSession, mockRepo, mock())

        val result = sut.uploadState(99, "testSnapshot", "testState")

        verify(mockRepo).saveSnapshotState("testSnapshot", 99, "testUser", "testState")

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `can get snapshot details`()
    {
        val mockDetails = SnapshotDetails("TEST STATE", mapOf("pjnz" to SnapshotFile("hash1", "filename1")))
        val mockRepo = mock<SnapshotRepository> {
          on { getSnapshotDetails("testSnapshot", 99, "testUser") }  doReturn mockDetails
        };

        val sut = ProjectsController(mockSession, mockRepo, mock())
        val result = sut.getSnapshotDetails(99, "testSnapshot")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val resultJson = parser.readTree(result.body)["data"]
        assertThat(resultJson["state"].asText()).isEqualTo("TEST STATE");
        val filesJson = resultJson["files"]
        assertThat(filesJson["pjnz"]["hash"].asText()).isEqualTo("hash1")
        assertThat(filesJson["pjnz"]["filename"].asText()).isEqualTo("filename1")
    }

    private fun assertExpectedSnapshot(node: JsonNode)
    {
        assertThat(node["id"].asText()).isEqualTo("testSnapshot")
        assertThat(node["created"].asText()).isEqualTo("createdTime")
        assertThat(node["updated"].asText()).isEqualTo("updatedTime")
    }
}
