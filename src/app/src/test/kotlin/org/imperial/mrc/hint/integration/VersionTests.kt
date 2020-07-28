package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.node.ArrayNode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class VersionTests : SecureIntegrationTests() {
    @BeforeEach
    fun setup() {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

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
}
