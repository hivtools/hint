package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.ResponseEntity

class RehydrateTests: SecureIntegrationTests()
{
    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can submit rehydrate output zip`()
    {
        val responseEntity = submitOutputResponse()
        assertSuccess(responseEntity, "ProjectRehydrateSubmitResponse")
    }

    @Test
    fun `can get rehydrate output status`()
    {
        val response = submitOutputResponse()
        val bodyJSON = ObjectMapper().readTree(response.body)
        val id = bodyJSON["data"]["id"].asText()
        val responseEntity = testRestTemplate.getForEntity<String>("/rehydrate/status/${id}")
        assertSuccess(responseEntity, "ProjectRehydrateStatusResponse")
    }

    @Test
    fun `can get rehydrate output result`()
    {
        val response = submitOutputResponse()
        val bodyJSON = ObjectMapper().readTree(response.body)
        val id = bodyJSON["data"]["id"].asText()

        do
        {
            Thread.sleep(500)
            val statusResponse = testRestTemplate.getForEntity<String>("/rehydrate/status/$id")
        } while (statusResponse.body!!.contains("\"status\":\"RUNNING\"")
                || statusResponse.body!!.contains("\"status\":\"PENDING\""))

        val responseEntity = testRestTemplate.getForEntity<String>("/rehydrate/result/${id}")

        val resultBody = ObjectMapper().readTree(responseEntity.body)
        val errors = resultBody["errors"] as ArrayNode
        assertThat(errors.count()).isEqualTo(1)
        assertThat(errors[0]["detail"].asText()).isEqualTo("Cannot load model outputs. " +
                "This fit was not generated on the Naomi web application. Please contact support.")
    }

    fun submitOutputResponse(): ResponseEntity<String>
    {
        val postEntity = getTestEntity("output.zip")
        return testRestTemplate.postForEntity("/rehydrate/submit/", postEntity)
    }
}
