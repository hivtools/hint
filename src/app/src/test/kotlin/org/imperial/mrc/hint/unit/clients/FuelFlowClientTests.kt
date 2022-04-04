package org.imperial.mrc.hint.unit.clients

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.FuelFlowClient
import org.imperial.mrc.hint.models.ErrorReport
import org.imperial.mrc.hint.models.Errors
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity

class FuelFlowClientTests
{
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

    @Test
    fun `can serialize request body`()
    {
        class LocalFuelFlowClient(objectMapper: ObjectMapper,
                                  appProperties: AppProperties
        ): FuelFlowClient(objectMapper, appProperties)
        {
            var urlPathCapture: String? = null
            var jsonCapture: String? = null

            override fun postJson(urlPath: String?, json:String): ResponseEntity<String>
            {
                urlPathCapture = urlPath
                jsonCapture = json
                return mock()
            }
        }

        val mockAppProperties = mock<AppProperties>{
            on { issueReportUrl } doReturn "http://testreport.com"
        }

        val sut = LocalFuelFlowClient(ObjectMapper(), mockAppProperties)

        sut.notifyTeams(data)

        Assertions.assertThat(sut.urlPathCapture).isNull()

        val requestJson = ObjectMapper().readValue<JsonNode>(sut.jsonCapture!!)

        Assertions.assertThat(requestJson["email"].asText()).isEqualTo("test.user@example.com")
        Assertions.assertThat(requestJson["country"].asText()).isEqualTo("Kenya")
        Assertions.assertThat(requestJson["projectName"].asText()).isEqualTo("Kenya2022")
        Assertions.assertThat(requestJson["section"].asText()).isEqualTo("Model")
        Assertions.assertThat(requestJson["modelRunId"].asText()).isEqualTo("123")
        Assertions.assertThat(requestJson["calibrateId"].asText()).isEqualTo("1234")
        Assertions.assertThat(requestJson["downloadIds"]["spectrum"].asText()).isEqualTo("spectrum123")
        Assertions.assertThat(requestJson["downloadIds"]["summary"].asText()).isEqualTo("summary123")
        Assertions.assertThat(requestJson["downloadIds"]["coarse_output"].asText()).isEqualTo("coarse123")
        Assertions.assertThat(requestJson["errors"][0]["key"].asText()).isEqualTo("fomot-hasah-livad")
        Assertions.assertThat(requestJson["errors"][0]["error"].asText()).isEqualTo("test error msg")
        Assertions.assertThat(requestJson["errors"][0]["detail"].asText()).isEqualTo("#65ae0d095ea")
        Assertions.assertThat(requestJson["errors"][1]["key"].asText()).isEqualTo("fomot-hasah-livid")
        Assertions.assertThat(requestJson["errors"][1]["error"].asText()).isEqualTo("test error msg2")
        Assertions.assertThat(requestJson["errors"][1]["detail"].asText()).isEqualTo("#25ae0d095e1")
        Assertions.assertThat(requestJson["description"].asText()).isEqualTo("")
        Assertions.assertThat(requestJson["stepsToReproduce"].asText()).isEqualTo("test steps")
        Assertions.assertThat(requestJson["browserAgent"].asText()).isEqualTo("test agent")
        Assertions.assertThat(requestJson["versions"]["naomi"].asText()).isEqualTo("v1")
        Assertions.assertThat(requestJson["versions"]["hintr"].asText()).isEqualTo("v2")
        Assertions.assertThat(requestJson["versions"]["rrq"].asText()).isEqualTo("v3")
        Assertions.assertThat(requestJson["versions"]["traduire"].asText()).isEqualTo("v4")
        Assertions.assertThat(requestJson["versions"]["hint"].asText()).isEqualTo("v5")
        Assertions.assertThat(requestJson["timeStamp"].asText()).isEqualTo("2021-10-12T14:07:22.759Z")
    }
}
