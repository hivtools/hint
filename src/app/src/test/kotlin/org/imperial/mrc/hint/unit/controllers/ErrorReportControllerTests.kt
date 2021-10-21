package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.kittinunf.fuel.core.Client
import com.github.kittinunf.fuel.core.FuelManager
import com.github.kittinunf.fuel.core.Response
import com.github.kittinunf.fuel.core.requests.DefaultBody
import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.controllers.ErrorReportController
import org.imperial.mrc.hint.helpers.readPropsFromTempFile

import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test
import org.springframework.http.*
import java.net.URL

class ErrorReportControllerTests
{

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

    @Test
    fun `can post error report to teams`()
    {
        val result = testFlowClient(ResponseEntity.ok("whatever"))

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        assertThat(result.body).isEqualTo("whatever")
    }

    @Test
    fun `can return error response when request is unsuccessful`()
    {
        val result = testFlowClient(ResponseEntity.badRequest().build())

        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
    }

    @Test
    fun `can serialize request body`()
    {
        val client = mock<Client> {
            onGeneric { executeRequest(any()) } doReturn
                    Response(statusCode = 200, body = DefaultBody(), url = URL("http://a.com"))
        }
        FuelManager.instance.client = client

        val sut = ErrorReportController(FuelFlowClient(ObjectMapper(),
                ConfiguredAppProperties(readPropsFromTempFile("issue_report_url=http://flow.com"))))

        sut.postErrorReport(data)

        verify(client).executeRequest(check {

            assertThat(it.url.toString()).isEqualTo("http://flow.com")

            assertThat(it.header("Content-Type")).isEqualTo(listOf("application/json"))

            val response = ObjectMapper().readValue<JsonNode>(it.body.asString("application/json"))

            assertThat(response["email"].asText()).isEqualTo("test.user@example.com")
            assertThat(response["country"].asText()).isEqualTo("Kenya")
            assertThat(response["projectName"].asText()).isEqualTo("Kenya2022")
            assertThat(response["section"].asText()).isEqualTo("Model")
            assertThat(response["jobId"].asText()).isEqualTo("123")
            assertThat(response["errors"][0]["key"].asText()).isEqualTo("fomot-hasah-livad")
            assertThat(response["errors"][0]["error"].asText()).isEqualTo("test error msg")
            assertThat(response["errors"][0]["detail"].asText()).isEqualTo("#65ae0d095ea")
            assertThat(response["errors"][1]["key"].asText()).isEqualTo("fomot-hasah-livid")
            assertThat(response["errors"][1]["error"].asText()).isEqualTo("test error msg2")
            assertThat(response["errors"][1]["detail"].asText()).isEqualTo("#25ae0d095e1")
            assertThat(response["description"].asText()).isEqualTo("")
            assertThat(response["stepsToReproduce"].asText()).isEqualTo("test steps")
            assertThat(response["browserAgent"].asText()).isEqualTo("test agent")
            assertThat(response["versions"]["naomi"].asText()).isEqualTo("v1")
            assertThat(response["versions"]["hintr"].asText()).isEqualTo("v2")
            assertThat(response["versions"]["rrq"].asText()).isEqualTo("v3")
            assertThat(response["versions"]["traduire"].asText()).isEqualTo("v4")
            assertThat(response["versions"]["hint"].asText()).isEqualTo("v5")
            assertThat(response["timeStamp"].asText()).isEqualTo("2021-10-12T14:07:22.759Z")
        })
    }

    private fun testFlowClient(response: ResponseEntity<String>): ResponseEntity<String>
    {
        val mockFlowClient = mock<FuelFlowClient>
        {
            on { notifyTeams(data) } doReturn response
        }

        val sut = ErrorReportController(mockFlowClient)

        return sut.postErrorReport(data)
    }

}
