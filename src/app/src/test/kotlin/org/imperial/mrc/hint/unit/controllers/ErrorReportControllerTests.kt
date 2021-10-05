package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.controllers.ErrorReportController
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import java.time.Instant

class ErrorReportControllerTests
{
    val objectMapper = ObjectMapper()

    @Test
    fun `can post error report to office365`()
    {
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

        val sut = ErrorReportController(objectMapper)

        val result = sut.postErrorReport(data)

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }
}