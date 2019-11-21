package org.imperial.mrc.hint.unit.exceptions

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.exceptions.RandomErrorCodeGenerator
import org.junit.jupiter.api.Test

class ErrorCodeGeneratorTests {
    @Test
    fun `generates a new error code`() {
        val sut = RandomErrorCodeGenerator()
        val result = sut.newCode()

        val regex = Regex("u[a-z]{2}-[a-z]{3}-[a-z]{3}")
        val match = regex.find(result)
        assertThat(match).isNotNull()
    }
}