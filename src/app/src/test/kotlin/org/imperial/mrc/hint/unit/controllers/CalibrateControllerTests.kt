package org.imperial.mrc.hint.unit.controllers

import org.junit.jupiter.api.Test
import org.imperial.mrc.hint.models.ModelOptions
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.CalibrateController
import org.imperial.mrc.hint.db.CalibrateDataRepository
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.isNotNull
import org.assertj.core.api.Assertions.assertThat
import org.springframework.http.ResponseEntity
import org.mockito.ArgumentMatchers.anyString
import org.jooq.tools.json.JSONObject
import org.jooq.tools.json.JSONArray

class CalibrateControllerTests
{
    private val mockResponse = mock<ResponseEntity<String>>()
    private val modelRunOptions = ModelOptions(mapOf(), mapOf())
    private val mockDataFromPath = JSONObject(mapOf("data" to "testData"))

    @Test
    fun `can submit calibrate`()
    {
        val modelCalibrationOptions = ModelOptions(mapOf(), mapOf())
        val mockAPIClient = mock<HintrAPIClient> {
            on { calibrateSubmit("testId", modelCalibrationOptions) } doReturn mockResponse
        }
        val sut = CalibrateController(mockAPIClient, mock())

        val result = sut.calibrateSubmit("testId", modelCalibrationOptions)
        assertThat(result).isSameAs(mockResponse)

    }

    @Test
    fun `can get calibrate status`()
    {
        val mockAPIClient = mock<HintrAPIClient> {
            on { getCalibrateStatus("testId") } doReturn mockResponse
        }

        val sut = CalibrateController(mockAPIClient, mock())

        val result = sut.calibrateStatus("testId")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get calibrate result metadata`()
    {
        val mockAPIClient = mock<HintrAPIClient> {
            on { getCalibrateResultMetadata("testId") } doReturn mockResponse
        }
        val sut = CalibrateController(mockAPIClient, mock())

        val result = sut.calibrateResultMetadata("testId")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get calibrate result data`()
    {
        val dataObj = JSONObject(mapOf("path" to "testPath"))
        val resObj = JSONObject(mapOf("data" to dataObj))
        val mockAPIClient = mock<HintrAPIClient> {
            on { getCalibrateResultData("testId") } doReturn ResponseEntity.ok(resObj.toString())
        }
        val mockCalibrateDataRepository = mock<CalibrateDataRepository> {
            on { getDataFromPath("testPath") } doReturn mockDataFromPath
        }
        val sut = CalibrateController(mockAPIClient, mockCalibrateDataRepository)

        val result = sut.calibrateResultData("testId")
        assertThat(result.body?.toString()).isEqualTo("{\"data\":\"testData\"}")
    }

    @Test
    fun `can get calibrate plot`()
    {
        val mockAPIClient = mock<HintrAPIClient> {
            on { getCalibratePlot("testId") } doReturn mockResponse
        }
        val sut = CalibrateController(mockAPIClient, mock())

        val result = sut.calibratePlot("testId")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get calibration options`()
    {
        val mockAPIClient = mock<HintrAPIClient> {
            on { getModelCalibrationOptions(anyString()) } doReturn mockResponse
        }
        val sut = CalibrateController(mockAPIClient, mock())
        val result = sut.calibrationOptions("MWI")
        assertThat(result).isSameAs(mockResponse)
    }
}