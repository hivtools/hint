package org.imperial.mrc.hint.integration

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity

class ActuatorTests: SecureIntegrationTests()
{
    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can see app health metrics`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/actuator/health")
        assertSuccess(responseEntity)
    }

    @Test
    fun `can see app http trace metrics`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/actuator/httptrace")
        assertSuccess(responseEntity)
    }

    @Test
    fun `can see app info metrics`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/actuator/info")
        assertSuccess(responseEntity)
    }
}