package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpStatus

class ChartDataTests :  SecureIntegrationTests()
{
    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
        val shapePostEntity = getTestEntity("malawi.geojson")
        testRestTemplate.postForEntity<String>("/baseline/shape/", shapePostEntity)


    }

    @Test
    fun `can get input time series chart data for anc`()
    {
        val ancPostEntity = getTestEntity("anc.csv")
        testRestTemplate.postForEntity<String>("/disease/anc/", ancPostEntity)

        val responseEntity = testRestTemplate.getForEntity<String>("/chart-data/input-time-series/anc")
        assertSuccess(responseEntity, "InputTimeSeriesResponse")

        val data = getResponseData(responseEntity)
        assertThat(data["data"][0]["plot"].asText()).startsWith("anc")
    }

    @Test
    fun `can get input time series chart data for programme`()
    {
        val programmePostEntity = getTestEntity("programme.csv")
        testRestTemplate.postForEntity<String>("/disease/programme/", programmePostEntity)

        val responseEntity = testRestTemplate.getForEntity<String>("/chart-data/input-time-series/programme")
        assertSuccess(responseEntity, "InputTimeSeriesResponse")

        val data = getResponseData(responseEntity)
        assertThat(data["data"][0]["plot"].asText()).startsWith("art")
    }

    @Test
    fun `can get expected error for unknown chart type`()
    {
        val responseEntity = testRestTemplate.getForEntity<String>("/chart-data/input-time-series/not-a-real-type")
        assertError(responseEntity, HttpStatus.BAD_REQUEST, "OTHER_ERROR", "Unknown input time series type.")
    }
}
