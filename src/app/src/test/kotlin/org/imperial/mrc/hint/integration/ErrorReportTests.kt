package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import java.time.Instant

class ErrorReportTests : SecureIntegrationTests()
{
    @Test
    fun `can post error report`()
    {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON

        val data = ErrorReport(
                "test.user@example.com",
                "Kenya",
                "Kenya2022",
                "Model",
                listOf(
                        Errors("#65ae0d095ea", "test error msg"),
                        Errors("#25ae0d095e1", "test error msg2")
                ),
                "test desc",
                "test steps",
                "test agent",
                Instant.now()
        )

        val objectMapper = ObjectMapper()
        val errorReportJson = objectMapper.writeValueAsString(data)

        val httpEntity = HttpEntity(errorReportJson, headers)
        val responseEntity = testRestTemplate.postForEntity<String>("/error-report", httpEntity)

        assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `can post error report with empty data`()
    {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON

        val data = ErrorReport(
                "test.user@example.com",
                "Kenya",
                "Kenya2022",
                "Model",
                listOf(
                        Errors("", "")
                ),
                "test desc",
                "",
                "test agent",
                Instant.now()
        )

        val objectMapper = ObjectMapper()
        val errorReportJson = objectMapper.writeValueAsString(data)
        println(errorReportJson)

        val httpEntity = HttpEntity(errorReportJson, headers)
        val responseEntity = testRestTemplate.postForEntity<String>("/error-report", httpEntity)

        assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.OK)
    }
}