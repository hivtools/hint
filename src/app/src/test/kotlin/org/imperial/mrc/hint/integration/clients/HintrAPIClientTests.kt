package org.imperial.mrc.hint.integration.clients

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrFuelAPIClient
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.models.ModelOptions
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.junit.jupiter.api.Test

class HintrApiClientTests
{
    val versionInfo = mapOf(
            "hintr" to "1.0.0",
            "naomi" to "1.0.0",
            "rrq" to "1.0.0"
    )

    @Test
    fun `can validate baseline individual`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val file = VersionFileWithPath("fakepath", "hash", "filename", false)
        val result = sut.validateBaselineIndividual(file, FileType.PJNZ)
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_FILE")
    }

    @Test
    fun `can validate baseline combined`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.validateBaselineCombined(mapOf(
                "pjnz" to VersionFileWithPath("fakePjnz", "pjnzHash", "pjnzFile", false),
                "shape" to VersionFileWithPath("fakeShape", "shapeHash", "shapeFile", false),
                "population" to VersionFileWithPath("fakePop", "popHash", "popFile", false)
        )
        )
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_BASELINE")
    }

    @Test
    fun `can validate survey and programme`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val file = VersionFileWithPath("fakepath", "hash", "filename", false)
        val result = sut.validateSurveyAndProgramme(file, "fakepath", FileType.ANC)
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_FILE")
    }

    @Test
    fun `can submit model run`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.submit(emptyMap(), ModelOptions(emptyMap(), emptyMap()))
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_INPUT")
    }

    @Test
    fun `can validate model options`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())

        val result = sut.validateModelOptions(emptyMap(), ModelOptions(emptyMap(), emptyMap()))
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_INPUT")
    }

    @Test
    fun `can get model run status`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.getStatus("1234")
        JSONValidator().validateSuccess(result.body!!, "ModelStatusResponse")
    }

    @Test
    fun `can get model run result`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.getResult("1234")
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "FAILED_TO_RETRIEVE_RESULT")
    }

    @Test
    fun `can calibrate`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.calibrate("1234", ModelOptions(emptyMap(), versionInfo))
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "FAILED_TO_RETRIEVE_RESULT")
    }

    @Test
    fun `can submit calibrate`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.calibrateSubmit("1234", ModelOptions(emptyMap(), versionInfo))
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_INPUT")
    }

    @Test
    fun `can get model calibration options`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.getModelCalibrationOptions()
        assertThat(result.statusCodeValue).isEqualTo(200)
        JSONValidator().validateSuccess(result.body!!, "ModelRunOptions")
    }

    @Test
    fun `can get plotting metadata`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val metadataResult = sut.getPlottingMetadata("MWI");

        JSONValidator().validateSuccess(metadataResult.body!!, "PlottingMetadataResponse")
    }

    @Test
    fun `can get version`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val metadataVersion = sut.getVersion()

        JSONValidator().validateSuccess(metadataVersion.body!!, "VersionInfo")
    }

    @Test
    fun `can cancel model run`()
    {
        val sut = HintrFuelAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.cancelModelRun("1234")
        assertThat(result.statusCodeValue).isEqualTo(400)
    }
}
