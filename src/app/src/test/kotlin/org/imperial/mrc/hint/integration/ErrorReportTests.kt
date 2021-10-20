package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.controllers.ErrorReportController
import org.imperial.mrc.hint.helpers.readPropsFromTempFile
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test

class ErrorReportTests
{
    @Test
    fun `can post error report`()
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
                "2021-10-12T14:07:22.759Z"
        )

        val props = readPropsFromTempFile("issue_report_url=https://mock.codes/200")

        val fuelFlowClient = FuelFlowClient(ObjectMapper(), ConfiguredAppProperties(props))

        val sut = ErrorReportController(fuelFlowClient)

        val result = sut.postErrorReport(data)

        Assertions.assertThat(result.statusCodeValue).isEqualTo(200)

        val response = ObjectMapper().readValue<JsonNode>(result.body!!)["data"]

        Assertions.assertThat(response["statusCode"].asInt()).isEqualTo(200)

        Assertions.assertThat(response["description"].textValue()).isEqualTo("OK")
    }
}