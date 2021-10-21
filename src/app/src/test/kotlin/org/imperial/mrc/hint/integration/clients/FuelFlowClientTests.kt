package org.imperial.mrc.hint.integration.clients

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.helpers.readPropsFromTempFile
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test

class FuelFlowClientTests
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
                "2021-10-12T14:07:22.759Z"
        )

        val props = readPropsFromTempFile("issue_report_url=https://mock.codes/200")

        val sut = FuelFlowClient(ObjectMapper(), ConfiguredAppProperties(props))

        val result = sut.notifyTeams(data)

        assertThat(result.statusCodeValue).isEqualTo(200)

        val response = ObjectMapper().readValue<JsonNode>(result.body!!)["data"]

        assertThat(response["statusCode"].asInt()).isEqualTo(200)

        assertThat(response["description"].textValue()).isEqualTo("OK")
    }

    @Test
    fun `can return an error when post unsuccessful`()
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

        val props = readPropsFromTempFile("issue_report_url=https://mock.codes/400")

        val sut = FuelFlowClient(ObjectMapper(), ConfiguredAppProperties(props))

        val result = sut.notifyTeams(data)

        assertThat(result.statusCodeValue).isEqualTo(400)

        val errors = ObjectMapper().readValue<JsonNode>(result.body!!)["errors"]

        assertThat(errors.isArray).isTrue

        assertThat(errors.count()).isEqualTo(1)

        assertThat(errors[0]["error"].textValue()).isEqualTo("OTHER_ERROR")
    }
}