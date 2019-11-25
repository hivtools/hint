package org.imperial.mrc.hint.unit.exceptions

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.exceptions.RandomErrorCodeGenerator
import org.imperial.mrc.hint.helpers.errorCodeRegex
import org.junit.jupiter.api.Test

class ErrorCodeGeneratorTests {

    @Test
    fun `generates a new error code`() {
        val sut = RandomErrorCodeGenerator()
        val result = sut.newCode()

        val match = errorCodeRegex.matchEntire(result)
        assertThat(match).isNotNull()
    }
}