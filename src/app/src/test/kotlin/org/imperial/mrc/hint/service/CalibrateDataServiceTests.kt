package org.imperial.mrc.hint.service

import org.junit.jupiter.api.Test
import com.nhaarman.mockito_kotlin.*
import org.mockito.ArgumentMatchers.anyString
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.CalibrateDataRepository
import org.springframework.http.ResponseEntity
import org.jooq.tools.json.JSONArray

class CalibrateDataServiceTests
{
    private val mockCalibratePathResponse = mock<ResponseEntity<String>> {
        on { body } doReturn """{"data": {"path": "testPath"}}"""
    }

    @Test
    fun `can get calibrate data`()
    {
        val mockClient = mock<HintrAPIClient> {
            on { getCalibrateResultData(anyString()) } doReturn mockCalibratePathResponse
        }

        val mockCalibrateDataRepo = mock<CalibrateDataRepository> {
            on { getDataFromPath("testPath") } doReturn JSONArray(listOf("testData"))
        }

        val sut = CalibrateDataService(mockClient, mockCalibrateDataRepo)

        val dataObj = sut.getCalibrateData("anyPath")

        assert(dataObj.toString() == "[\"testData\"]")
    }
}