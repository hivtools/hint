package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.controllers.ErrorReportController
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.imperial.mrc.hint.service.ProjectVersionService
import org.junit.jupiter.api.Test
import org.mockito.Mockito.verifyNoInteractions
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.util.*

class ErrorReportControllerTests
{

    private val mockProperties = mock<AppProperties> {
        on { supportEmail } doReturn "support@email.com"
    }

    private val data = ErrorReport(
            "test.user@example.com",
            "Kenya",
            "Kenya2022",
            "Model",
            "123",
            "1234",
            mapOf("spectrum" to "spectrum123", "summary" to "summary123", "coarse_output" to "coarse123" ),
            listOf(
                    Errors("#65ae0d095ea", "test error msg", "fomot-hasah-livad"),
                    Errors("#25ae0d095e1", "test error msg2", "fomot-hasah-livid")
            ),
            "",
            "test steps",
            "test agent",
            mapOf(
                    "naomi" to "v1",
                    "hintr" to "v2",
                    "rrq" to "v3",
                    "traduire" to "v4",
                    "hint" to "v5"
            ),
            "2021-10-12T14:07:22.759Z"
    )

    private val mockProjectVersionService = mock<ProjectVersionService>()

    @Test
    fun `can post error report to teams`()
    {
        val result = testFlowClient(ResponseEntity.ok("whatever"), Optional.of(1))

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        assertThat(result.body).isEqualTo("whatever")

        verify(mockProjectVersionService).cloneProjectToUser(1, listOf(mockProperties.supportEmail))
    }

    @Test
    fun `project not cloned when no project active`()
    {
        val result = testFlowClient(ResponseEntity.ok("whatever"), Optional.empty())

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        assertThat(result.body).isEqualTo("whatever")

        verifyNoInteractions(mockProjectVersionService)
    }

    @Test
    fun `project not cloned when issue report submitted by support user`()
    {
        val newData = data.copy();
        newData.email = mockProperties.supportEmail;

        val mockFlowClient = mock<FuelFlowClient>
        {
            on { notifyTeams(newData) } doReturn ResponseEntity.ok("whatever")
        }

        val sut = ErrorReportController(mockFlowClient, mockProjectVersionService, mockProperties)

        val result = sut.postErrorReport(newData, Optional.of(1))
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        assertThat(result.body).isEqualTo("whatever")

        verifyNoInteractions(mockProjectVersionService)
    }

    @Test
    fun `can return error response when request is unsuccessful`()
    {
        val result = testFlowClient(ResponseEntity.badRequest().build(), Optional.of(1))

        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        verifyNoInteractions(mockProjectVersionService)
    }

    private fun testFlowClient(response: ResponseEntity<String>, projectId: Optional<Int>): ResponseEntity<String>
    {
        val mockFlowClient = mock<FuelFlowClient>
        {
            on { notifyTeams(data) } doReturn response
        }

        val sut = ErrorReportController(mockFlowClient, mockProjectVersionService, mockProperties)

        return sut.postErrorReport(data, projectId)
    }

}
