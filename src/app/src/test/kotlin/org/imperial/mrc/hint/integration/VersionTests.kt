package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.VERSION_SNAPSHOT
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import com.fasterxml.jackson.databind.node.ObjectNode
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.*

class VersionTests : SecureIntegrationTests() {
    @BeforeEach
    fun setup() {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    private val versionName = "testVersionEndpoint"
    private val testState = "{\"state\": \"test\"}"

    @Test
    fun `can create new version`()
    {
        val result = createVersion()
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val data = getResponseData(result)

        assertThat(data["id"].asInt()).isGreaterThan(0)
        assertThat(data["name"].asText()).isEqualTo("testVersion")
        val snapshots = data["snapshots"] as ArrayNode
        assertThat(snapshots.count()).isEqualTo(1)
        assertThat(snapshots[0]["id"].asText().count()).isGreaterThan(0)
        LocalDateTime.parse(snapshots[0]["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        LocalDateTime.parse(snapshots[0]["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
    }

    @Test
    fun `can create new snapshot from parent`()
    {
        val createResult = createVersion()
        val createVersionData = getResponseData(createResult)
        val versionId = createVersionData["id"].asInt()
        val snapshots = createVersionData["snapshots"] as ArrayNode
        val snapshotId = snapshots[0]["id"].asText()
        getUpdateSnapshotStateResult(versionId, snapshotId, testState)

        val result = getNewSnapshotResult(versionId, snapshotId)
        val data = getResponseData(result)

        val newSnapshotId = data["id"].asText()
        assertThat(newSnapshotId.count()).isGreaterThan(0)
        LocalDateTime.parse(data["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        LocalDateTime.parse(data["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)

        val savedVersion = dsl.select(VERSION_SNAPSHOT.STATE,
                VERSION_SNAPSHOT.CREATED,
                VERSION_SNAPSHOT.UPDATED)
                .from(VERSION_SNAPSHOT)
                .where(VERSION_SNAPSHOT.ID.eq(newSnapshotId))
                .fetchOne()

        assertThat(savedVersion[VERSION_SNAPSHOT.STATE]).isEqualTo(testState)
        assertThat(savedVersion[VERSION_SNAPSHOT.UPDATED]).isEqualTo(savedVersion[VERSION_SNAPSHOT.CREATED])
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
        val createResult = createVersion()
        val data = getResponseData(createResult)
        val versionId = data["id"].asInt()
        val snapshots = data["snapshots"] as ArrayNode
        val snapshotId = snapshots[0]["id"].asText()

        val result = getUpdateSnapshotStateResult(versionId, snapshotId, testState)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val savedVersion = dsl.select(VERSION_SNAPSHOT.STATE,
                VERSION_SNAPSHOT.CREATED,
                VERSION_SNAPSHOT.UPDATED)
                .from(VERSION_SNAPSHOT)
                .where(VERSION_SNAPSHOT.ID.eq(snapshotId))
                .fetchOne()

        assertThat(savedVersion[VERSION_SNAPSHOT.STATE]).isEqualTo(testState)
        assertThat(savedVersion[VERSION_SNAPSHOT.UPDATED]).isAfter(savedVersion[VERSION_SNAPSHOT.CREATED])
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
    fun `can get versions`()
    {
        val createResult = createVersion()

        val result = testRestTemplate.getForEntity<String>("/versions/")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val data = getResponseData(result) as ArrayNode
        val createData = getResponseData(createResult) as ObjectNode
        assertThat(data.count()).isEqualTo(1)
        assertThat(data[0]["id"]).isEqualTo(createData["id"])
        assertThat(data[0]["name"].asText()).isEqualTo("testVersion")
        val snapshots = data[0]["snapshots"] as ArrayNode
        assertThat(snapshots.count()).isEqualTo(1)
        val createSnapshots = createData["snapshots"] as ArrayNode
        assertThat(snapshots[0]["id"]).isEqualTo(createSnapshots[0]["id"])
        assertThat(snapshots[0]["created"]).isEqualTo(createSnapshots[0]["created"])
        assertThat(snapshots[0]["updated"]).isEqualTo(createSnapshots[0]["updated"])
    }

    private fun createVersion(): ResponseEntity<String>
    {
        val map = LinkedMultiValueMap<String, String>()
        map.add("name", "testVersion")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        val httpEntity =  HttpEntity(map, headers)
        return testRestTemplate.postForEntity<String>("/version/", httpEntity)
    }

    private fun getUpdateSnapshotStateResult(versionId: Int, snapshotId: String, state: String,
                                             language: String? = null): ResponseEntity<String>
    {
        val headers = getStandardHeaders(language)

        val httpEntity =  HttpEntity(state, headers)
        val url = "/version/$versionId/snapshot/$snapshotId/state/"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun getNewSnapshotResult(versionId: Int, snapshotId: String, language: String? = null): ResponseEntity<String>
    {
        val headers = getStandardHeaders(language)
        val httpEntity = HttpEntity(null, headers)
        val url = "/version/$versionId/snapshot/?parent=$snapshotId"
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
