package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.ModelRunController
import org.imperial.mrc.hint.models.ModelRunOptions
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity

class ModelRunControllerTests
{

    private val mockResponse = mock<ResponseEntity<String>>()
    private val modelRunOptions = ModelRunOptions(mapOf(), mapOf())

    @Test
    fun `can run`()
    {
        val mockFiles = mapOf<String, VersionFileWithPath>()
        val mockFileManager = mock<FileManager> {
            on { getFiles() } doReturn mockFiles
        }

        val mockAPIClient = mock<HintrAPIClient> {
            on { submit(mockFiles, modelRunOptions) } doReturn mockResponse
        }

        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.run(modelRunOptions)
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can validate modelOptions`()
    {
        val mockFiles = mapOf<String, VersionFileWithPath>()
        val mockFileManager = mock<FileManager> {
            on { getFiles() } doReturn mockFiles
        }

        val mockAPIClient = mock<HintrAPIClient> {
            on { validateModelOptions(mockFiles, modelRunOptions) } doReturn mockResponse
        }

        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.validateModelOptions(modelRunOptions)
        assertThat(result).isSameAs(mockResponse)

    }

    @Test
    fun `can get status`()
    {
        val mockFileManager = mock<FileManager>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getStatus("testId") } doReturn mockResponse
        }

        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.status("testId")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get result`()
    {
        val mockFileManager = mock<FileManager>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getResult("testId") } doReturn mockResponse
        }
        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.result("testId")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can calibrate`()
    {
        val modelCalibrationOptions = ModelRunOptions(mapOf(), mapOf())
        val mockAPIClient = mock<HintrAPIClient> {
            on { calibrate("testId", modelCalibrationOptions) } doReturn mockResponse
        }
        val sut = ModelRunController(mock(), mockAPIClient)

        val result = sut.calibrate("testId", modelCalibrationOptions)
        assertThat(result).isSameAs(mockResponse)

    }

    @Test
    fun `can get options`()
    {
        val mockFiles: Map<String, VersionFileWithPath> = mapOf()
        val mockFileManager = mock<FileManager> {
            on { getFiles(FileType.Shape, FileType.Survey, FileType.Programme, FileType.ANC) } doReturn mockFiles
        }

        val mockAPIClient = mock<HintrAPIClient> {
            on { getModelRunOptions(mockFiles) } doReturn mockResponse
        }
        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.options()
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get calibration options`()
    {
        val mockAPIClient = mock<HintrAPIClient> {
            on { getModelCalibrationOptions() } doReturn mockResponse
        }
        val sut = ModelRunController(mock(), mockAPIClient)
        val result = sut.calibrationOptions()
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can cancel`()
    {
        val mockFileManager = mock<FileManager>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { cancelModelRun("testId") } doReturn mockResponse
        }
        val sut = ModelRunController(mockFileManager, mockAPIClient)

        val result = sut.cancel("testId")
        assertThat(result).isSameAs(mockResponse)
    }
}
