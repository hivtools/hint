package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.PROJECT_VERSION
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import com.fasterxml.jackson.databind.node.ObjectNode
import org.springframework.boot.test.web.client.exchange
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.*

class ProjectTests : SnapshotFileTests() {
    @BeforeEach
    fun setup() {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    private val projectName = "testProjectEndpoint"
    private val testState = "{\"state\": \"test\"}"

    @Test
    fun `can create new project`()
    {
        val result = createProject()
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val data = getResponseData(result)

        assertThat(data["id"].asInt()).isGreaterThan(0)
        assertThat(data["name"].asText()).isEqualTo("testProject")
        val snapshots = data["snapshots"] as ArrayNode
        assertThat(snapshots.count()).isEqualTo(1)
        assertThat(snapshots[0]["id"].asText().count()).isGreaterThan(0)
        LocalDateTime.parse(snapshots[0]["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        LocalDateTime.parse(snapshots[0]["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
    }

    @Test
    fun `can create new snapshot from parent`()
    {
        val createResult = createProject()
        val createProjectData = getResponseData(createResult)
        val projectId = createProjectData["id"].asInt()
        val snapshots = createProjectData["snapshots"] as ArrayNode
        val snapshotId = snapshots[0]["id"].asText()
        getUpdateSnapshotStateResult(projectId, snapshotId, testState)

        val result = getNewSnapshotResult(projectId, snapshotId)
        val data = getResponseData(result)

        val newSnapshotId = data["id"].asText()
        assertThat(newSnapshotId.count()).isGreaterThan(0)
        LocalDateTime.parse(data["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        LocalDateTime.parse(data["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)

        val savedProject = dsl.select(PROJECT_VERSION.STATE,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(newSnapshotId))
                .fetchOne()

        assertThat(savedProject[PROJECT_VERSION.STATE]).isEqualTo(testState)
        assertThat(savedProject[PROJECT_VERSION.UPDATED]).isEqualTo(savedProject[PROJECT_VERSION.CREATED])
    }

    @Test
    fun `can return expected English error when copy nonexistent snapshot`()
    {
        val result = getNewSnapshotResult(1, "nonExistent")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Snapshot does not exist.")
    }

    @Test
    fun `can return expected French error when copy nonexistent snapshot`()
    {
        val result = getNewSnapshotResult(1, "nonExistent","fr")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("L'instantané n'existe pas.")
    }

    @Test
    fun `can update snapshot state`()
    {
        val createResult = createProject()
        val data = getResponseData(createResult)
        val projectId = data["id"].asInt()
        val snapshots = data["snapshots"] as ArrayNode
        val snapshotId = snapshots[0]["id"].asText()

        val result = getUpdateSnapshotStateResult(projectId, snapshotId, testState)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val savedProject = dsl.select(PROJECT_VERSION.STATE,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(snapshotId))
                .fetchOne()

        assertThat(savedProject[PROJECT_VERSION.STATE]).isEqualTo(testState)
        assertThat(savedProject[PROJECT_VERSION.UPDATED]).isAfter(savedProject[PROJECT_VERSION.CREATED])
    }

    @Test
    fun `can return expected English error when update nonexistent snapshot state`()
    {
        val result = getUpdateSnapshotStateResult(1, "nonExistent", "testState")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Snapshot does not exist.")
    }

    @Test
    fun `can return expected French error when update nonexistent snapshot state`()
    {
        val result = getUpdateSnapshotStateResult(1, "nonExistent", "testState",
                "fr")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("L'instantané n'existe pas.")
    }

    @Test
    fun `can get projects`()
    {
        val createResult = createProject()

        val result = testRestTemplate.getForEntity<String>("/projects/")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val data = getResponseData(result) as ArrayNode
        val createData = getResponseData(createResult) as ObjectNode
        assertThat(data.count()).isEqualTo(1)
        assertThat(data[0]["id"]).isEqualTo(createData["id"])
        assertThat(data[0]["name"].asText()).isEqualTo("testProject")
        val snapshots = data[0]["snapshots"] as ArrayNode
        assertThat(snapshots.count()).isEqualTo(1)
        val createSnapshots = createData["snapshots"] as ArrayNode
        assertThat(snapshots[0]["id"]).isEqualTo(createSnapshots[0]["id"])
        assertThat(snapshots[0]["created"]).isEqualTo(createSnapshots[0]["created"])
        assertThat(snapshots[0]["updated"]).isEqualTo(createSnapshots[0]["updated"])
    }

    @Test
    fun `can get snapshot details`()
    {
        val createResult = createProject()
        val createProjectData = getResponseData(createResult)
        val projectId = createProjectData["id"].asInt()
        val snapshots = createProjectData["snapshots"] as ArrayNode
        val snapshotId = snapshots[0]["id"].asText()
        getUpdateSnapshotStateResult(projectId, snapshotId, "TEST STATE")

        val pjnzHash = setUpSnapshotFileAndGetHash("Botswana2018.PJNZ", "/baseline/pjnz/")

        val result = testRestTemplate.getForEntity<String>("/project/$projectId/snapshot/$snapshotId")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val data = getResponseData(result)
        assertThat(data["state"].asText()).isEqualTo("TEST STATE")
        assertThat(data["files"]["pjnz"]["hash"].asText()).isEqualTo(pjnzHash)
        assertThat(data["files"]["pjnz"]["filename"].asText()).isEqualTo("Botswana2018.PJNZ")
    }

    @Test
    fun `can return expected English error when get nonexistent snapshot details`()
    {
        val result = testRestTemplate.getForEntity<String>("/project/99/snapshot/nosnapshot")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Snapshot does not exist.")
    }

    @Test
    fun `can return expected French error when get nonexistent snapshot details`()
    {
        val headers = getStandardHeaders("fr")
        val httpEntity =  HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/snapshot/nosnapshot", HttpMethod.GET, httpEntity)
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("L'instantané n'existe pas.")
    }

    private fun createProject(): ResponseEntity<String>
    {
        val map = LinkedMultiValueMap<String, String>()
        map.add("name", "testProject")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        val httpEntity =  HttpEntity(map, headers)
        return testRestTemplate.postForEntity<String>("/project/", httpEntity)
    }

    private fun getUpdateSnapshotStateResult(projectId: Int, snapshotId: String, state: String,
                                             language: String? = null): ResponseEntity<String>
    {
        val headers = getStandardHeaders(language)

        val httpEntity =  HttpEntity(state, headers)
        val url = "/project/$projectId/snapshot/$snapshotId/state/"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun getNewSnapshotResult(projectId: Int, snapshotId: String, language: String? = null): ResponseEntity<String>
    {
        val headers = getStandardHeaders(language)
        val httpEntity = HttpEntity(null, headers)
        val url = "/project/$projectId/snapshot/?parent=$snapshotId"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun getStandardHeaders(language: String?): HttpHeaders
    {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        if (language != null)
        {
            headers.acceptLanguage = mutableListOf(Locale.LanguageRange(language))
        }

        return headers
    }
}
