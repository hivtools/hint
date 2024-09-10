package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity

class MetadataTests : SecureIntegrationTests()
{

    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can get version`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/meta/hintr/version/")
        assertSuccess(responseEntity, "VersionInfo")
    }
}
