package org.imperial.mrc.hint.service

import org.junit.jupiter.api.Test
import com.nhaarman.mockito_kotlin.*
import org.mockito.ArgumentMatchers.anyString
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.CalibrateDataRepository
import org.imperial.mrc.hint.models.CalibrateResultRow
import org.springframework.http.ResponseEntity
import org.jooq.tools.json.JSONArray

class CalibrateDataServiceTests
{
    private val mockCalibratePathResponse = mock<ResponseEntity<String>> {
        on { body } doReturn """{"data": {"path": "testPath"}}"""
    }

    private val mockResultRow = CalibrateResultRow(
        "testIndicator", "testCalendarQuarter", "testAgeGroup", "testSex",
        "testAreaId", 1, 2, 3, 4
    )

    @Test
    fun `can get calibrate data`()
    {
        val mockClient = mock<HintrAPIClient> {
            on { getCalibrateResultData(anyString()) } doReturn mockCalibratePathResponse
        }

        val mockCalibrateDataRepo = mock<CalibrateDataRepository> {
            on { getDataFromPath("testPath") } doReturn listOf(mockResultRow)
        }

        val sut = CalibrateDataService(mockClient, mockCalibrateDataRepo)

        val dataObj = sut.getCalibrateData("anyPath")

        assert(dataObj[0] == mockResultRow)
    }
}