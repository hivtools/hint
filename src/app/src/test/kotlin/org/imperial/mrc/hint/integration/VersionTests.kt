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
    fun `can update snapshot state`()
    {
        val createResult = createVersion()
        val data = getResponseData(createResult)
        val versionId = data["id"].asInt()
        val snapshots = data["snapshots"] as ArrayNode
        val snapshotId = snapshots[0]["id"].asText()

        val testState = "{\"state\": \"test\"}"
        val result = getUpdateVersionStateResult(versionId, snapshotId, testState)
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
        val result = getUpdateVersionStateResult(1, "nonExistent", "testState")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Snapshot does not exist.")
    }

    @Test
    fun `can return expected French error when update nonexistent snapshot state`()
    {
        val result = getUpdateVersionStateResult(1, "nonExistent", "testState",
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

    private fun getUpdateVersionStateResult(versionId: Int, snapshotId: String, state: String,
                                            language: String? = null): ResponseEntity<String>
    {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        if (language != null)
        {
            headers.acceptLanguage = mutableListOf(Locale.LanguageRange(language))
        }

        val httpEntity =  HttpEntity(state, headers)
        val url = "/version/$versionId/snapshot/$snapshotId/state/"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }
}
