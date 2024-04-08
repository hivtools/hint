package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.util.LinkedMultiValueMap

class ErrorReportTests: SecureIntegrationTests()
{

    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    private fun createProject(): ResponseEntity<String>
    {
        val map = LinkedMultiValueMap<String, String>()
        map.add("name", "testProject")
        map.add("note", "notes")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        val httpEntity = HttpEntity(map, headers)
        return testRestTemplate.postForEntity("/project/", httpEntity)
    }

    @Test
    fun `can post error report`()
    {
        val data = """{
            "email": "test.user@example.com",
            "country": "South Africa",
            "projectName": "South 2 Worldpop",
            "section": "Fit model",
            "modelRunId": "job12",
            "calibrateId": "1234",
            "downloadIds": {
            "spectrum": "spectrum123",
             "summary": "summary123",
              "coarse_output": "coarse123"
            },
            "errors": [
                {
                    "detail": "Please contact support for troubleshooting1",
                    "error": "OTHER_ERROR",
                    "key": "go-now-then"
                },
                {
                    "detail": "Please contact support for support",
                    "error": "OTHER_ERROR",
                    "key": "go-later-then"
                }
            ],
            "description": "description of the error msg",
            "stepsToReproduce": "step to reproduce desc",
            "browserAgent": "Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW)",
            "versions": {
                "naomi": "v1",
                "hintr": "v2",
                "rrq": "v3",
                "traduire": "v4",
                "hint": "v5"
            },
            "timeStamp": "2021-10-12T14:07:22.759Z"
        }""".trimIndent()

        userRepo.addUser("naomi-support@imperial.ac.uk", "password")
        val project = createProject()
        val createProjectData = getResponseData(project)
        val projectId = createProjectData["id"].asInt()

        val headers = HttpHeaders()

        headers.contentType = MediaType.APPLICATION_JSON

        val entity = HttpEntity(data, headers)

        val responseJson = testRestTemplate.postForEntity<String>("/error-report?projectId=${projectId}", entity)

        Assertions.assertThat(responseJson.statusCodeValue).isEqualTo(200)

        val response = ObjectMapper().readValue<JsonNode>(responseJson.body!!)["data"]

        Assertions.assertThat(response["statusCode"].asInt()).isEqualTo(200)

        Assertions.assertThat(response["description"].textValue()).isEqualTo("OK")
    }
}
