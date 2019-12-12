package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.HintrAPIClient
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.models.ModelRunOptions
import org.imperial.mrc.hint.models.SessionFileWithPath
import org.junit.jupiter.api.Test

class HintrApiClientTests {

    @Test
    fun `can validate baseline individual`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val file = SessionFileWithPath("fakepath", "hash", "filename")
        val result = sut.validateBaselineIndividual(file, FileType.PJNZ)
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_FILE")
    }

    @Test
    fun `can validate baseline combined`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.validateBaselineCombined( mapOf(
                "pjnz" to SessionFileWithPath("fakePjnz", "pjnzHash", "pjnzFile"),
                "shape" to SessionFileWithPath("fakeShape", "shapeHash", "shapeFile"),
                "population" to SessionFileWithPath("fakePop", "popHash", "popFile")
            )
        )
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_BASELINE")
    }

    @Test
    fun `can validate survey and programme`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val file = SessionFileWithPath("fakepath", "hash", "filename")
        val result = sut.validateSurveyAndProgramme(file, "fakepath", FileType.ANC)
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_FILE")
    }

    @Test
    fun `can submit model run`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.submit(emptyMap(), ModelRunOptions(emptyMap(), emptyMap()))
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "VERSION_OUT_OF_DATE")
    }

    @Test
    fun `can get model run status`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.getStatus("1234")
        JSONValidator().validateSuccess(result.body!!, "ModelStatusResponse")
    }
    @Test
    fun `can get model run result`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.getResult("1234")
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "FAILED_TO_RETRIEVE_RESULT")
    }

    @Test
    fun `can get plotting metadata`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val metadataResult = sut.getPlottingMetadata("MWI");

        JSONValidator().validateSuccess(metadataResult.body!!, "PlottingMetadataResponse")
    }

    @Test
    fun `can cancel model run`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.cancelModelRun("1234")
        assertThat(result.statusCodeValue).isEqualTo(400)
    }
}
