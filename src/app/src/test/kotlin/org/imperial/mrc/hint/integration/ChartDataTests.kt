package org.imperial.mrc.hint.integration

import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity

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
    }

    @Test
    fun `can get input time series chart data for programme`()
    {
        val programmePostEntity = getTestEntity("programme.csv")
        testRestTemplate.postForEntity<String>("/disease/programme/", programmePostEntity)

        val responseEntity = testRestTemplate.getForEntity<String>("/chart-data/input-time-series/programme")
        assertSuccess(responseEntity, "InputTimeSeriesResponse")
    }
}
