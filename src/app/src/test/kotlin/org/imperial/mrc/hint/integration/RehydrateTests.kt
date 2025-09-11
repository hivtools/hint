package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity

class RehydrateTests: SecureIntegrationTests()
{
    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can get rehydrate output result`()
    {
        val postEntity = getTestEntity("output.zip")
        val responseEntity = testRestTemplate.postForEntity<String>("/rehydrate/zip", postEntity)

        val resultBody = ObjectMapper().readTree(responseEntity.body)
        val errors = resultBody["errors"] as ArrayNode
        assertThat(errors.count()).isEqualTo(1)
        assertThat(errors[0]["detail"].asText()).isEqualTo("Cannot load model outputs. " +
                "This fit was not generated on the Naomi web application. Please contact support.")
    }
}
