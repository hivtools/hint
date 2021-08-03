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
    fun `can get metadata`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/meta/plotting/MWI/")
        assertSuccess(responseEntity, "PlottingMetadataResponse")
    }

    @Test
    fun `can get version`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/meta/hintr/version/")
        assertSuccess(responseEntity, "VersionInfo")
    }

    @Test
    fun `can get uploadToADR metadata`()
    {
        val modelId = waitForModelRunResult()
        val calibrateId = waitForCalibrationResult(modelId)
        val responseId = waitForSubmitDownloadOutput(calibrateId, "spectrum")

        val responseEntity = testRestTemplate.getForEntity<String>("/meta/adr/$responseId")
        assertSuccess(responseEntity, "AdrMetadataResponse")
    }
    @Test
    fun `can get generic chart metadata`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/meta/generic-chart/")
        assertSuccess(responseEntity)
        val data = ObjectMapper().readTree(responseEntity.body!!)["data"]
        assertThat((data["input-time-series"]["datasets"] as ArrayNode).count()).isEqualTo(2)
        assertThat((data["input-time-series"]["chartConfig"] as ArrayNode)[0]["config"].asText()).startsWith("(\n")
    }
}
