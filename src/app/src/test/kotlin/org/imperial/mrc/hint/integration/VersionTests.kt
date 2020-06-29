package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
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
        val map = mapOf("name" to "testVersionEndpoint")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(map)

        val httpEntity =  HttpEntity(jsonString, headers)
        val result = testRestTemplate.postForEntity<String>("/version/", httpEntity)
        val data = getResponseData(result)

        assertThat(data["id"].asInt()).isGreaterThan(0)
        assertThat(data["name"].asText()).isEqualTo("testVersionEndpoint")
        val snapshots = data["snapshots"] as ArrayNode
        assertThat(snapshots.count()).isEqualTo(1)
        assertThat(snapshots[0]["id"].asText().count()).isGreaterThan(0)
        LocalDateTime.parse(snapshots[0]["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        LocalDateTime.parse(snapshots[0]["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
    }
}
