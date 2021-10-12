package org.imperial.mrc.hint.integration.clients

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.clients.FlowClient
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import java.time.Instant

class FlowClientTests
{
    @Test
    fun `can post flow`()
    {
        val data = ErrorReport(
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

        val sut = FlowClient(ObjectMapper())

        val result = sut.notifyTeams("", data)

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
    }
}
