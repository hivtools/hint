package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.HintrAPIClient
import org.imperial.mrc.hint.helpers.JSONValidator
import org.junit.jupiter.api.Test

class HintrApiClientTests {

    @Test
    fun `can validate baseline`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.validateBaseline("fakepath", FileType.PJNZ)
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_FILE")
    }

    @Test
    fun `can validate survey and programme`() {
        val sut = HintrAPIClient(ConfiguredAppProperties(), ObjectMapper())
        val result = sut.validateSurveyAndProgramme("fakepath", "fakepath", FileType.ANC)
        assertThat(result.statusCodeValue).isEqualTo(400)
        JSONValidator().validateError(result.body!!, "INVALID_FILE")
    }
}
