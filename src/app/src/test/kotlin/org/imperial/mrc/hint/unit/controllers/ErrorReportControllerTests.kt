package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.controllers.ErrorReportController
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.anyString
import org.springframework.http.*
import org.springframework.web.client.RestTemplate
import java.time.Instant

class ErrorReportControllerTests
{
    private val objectMapper = ObjectMapper()

    private val data = ErrorReport(
            "test.user@example.com",
            "Kenya",
            "Kenya2022",
            "Model",
            "123",
            listOf(
                    Errors("#65ae0d095ea", "test error msg", "fomot-hasah-livad"),
                    Errors("#25ae0d095e1", "test error msg2", "fomot-hasah-livid")
            ),
            "test desc",
            "test steps",
            "test agent",
            Instant.now()
    )

    @Test
    fun `can post error report to teams`()
    {
        val url = "https://azure.com"

        val mockAppProperties = mock<AppProperties> {
            on { issueReportUrl } doReturn url
        }

        val mockRestTemplate = mock<RestTemplate> {
            on { postForEntity<String>(anyString(), any(), any()) } doReturn ResponseEntity.ok().build()
        }

        val sut = ErrorReportController(objectMapper, mockRestTemplate, mockAppProperties)

        val result = sut.postErrorReport(data)

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `can return error response when request is unsuccessful `()
    {
        val url = "https://azure.com"

        val mockAppProperties = mock<AppProperties> {
            on { issueReportUrl } doReturn url
        }

        val mockRestTemplate = mock<RestTemplate> {
            on { postForEntity<String>(anyString(), any(), any()) } doReturn ResponseEntity.badRequest().build()
        }

        val sut = ErrorReportController(objectMapper, mockRestTemplate, mockAppProperties)

        val result = sut.postErrorReport(data)

        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }
}
