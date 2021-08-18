package org.imperial.mrc.hint.unit.controllers;

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.ChartDataController
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity

class ChartDataControllerTests {

    private val mockFiles = mapOf<String, VersionFileWithPath>()
    private val mockResponse = mock<ResponseEntity<String>>()

    @Test
    fun `can get anc input time series`()
    {
        val mockFileManager = mock<FileManager> {
            on { getFiles(FileType.Shape, FileType.ANC) } doReturn mockFiles
        }
        val mockClient = mock<HintrAPIClient> {
            on { getInputTimeSeriesChartData("anc", mockFiles) } doReturn mockResponse
        }

        val sut = ChartDataController(mockFileManager, mockClient)
        val response = sut.inputTimeSeries("anc")
        assertThat(response).isSameAs(mockResponse)
    }

    @Test
    fun `can get programme input time series`()
    {
        val mockFileManager = mock<FileManager> {
            on { getFiles(FileType.Shape, FileType.Programme) } doReturn mockFiles
        }
        val mockClient = mock<HintrAPIClient> {
            on { getInputTimeSeriesChartData("programme", mockFiles) } doReturn mockResponse
        }

        val sut = ChartDataController(mockFileManager, mockClient)
        val response = sut.inputTimeSeries("programme")
        assertThat(response).isSameAs(mockResponse)
    }
}
