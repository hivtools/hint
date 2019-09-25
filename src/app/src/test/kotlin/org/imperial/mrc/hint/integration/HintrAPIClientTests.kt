package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.HintrAPIClient
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.models.ModelRunParameters
import org.junit.jupiter.api.Test

class HintrApiClientTests {

    @Test
    fun `can validate baseline`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.validateBaselineIndividual("original", "fakepath", FileType.PJNZ)
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_FILE")
    }

    @Test
    fun `can validate survey and programme`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.validateSurveyAndProgramme("original", "fakepath", "fakepath", FileType.ANC)
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_FILE")
    }

    @Test
    fun `can submit model run`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.submit(mapOf(), ModelRunParameters(1, 1, 1, mapOf()))
        assertThat(result.statusCodeValue).isEqualTo(200)
        JSONValidator().validateSuccess(result.body!!, "ModelSubmitResponse")
    }

    @Test
    fun `can get model run status`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val submitResult = sut.submit(mapOf(), ModelRunParameters(1, 1, 1, mapOf()))

        val id = ObjectMapper().readValue<JsonNode>(submitResult.body!!)["data"]["id"].textValue()

        val result = sut.getStatus(id)
        JSONValidator().validateSuccess(result.body!!, "ModelStatusResponse")
    }
}
