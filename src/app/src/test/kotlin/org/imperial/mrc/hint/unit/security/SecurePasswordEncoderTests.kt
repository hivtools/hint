package org.imperial.mrc.hint.unit.security

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.SecurePasswordEncoder
import org.junit.jupiter.api.Test

class SecurePasswordEncoderTests
{

    @Test
    fun `can match encoded password`()
    {
        val sut = SecurePasswordEncoder()
        val plainTextPassword = "myplaintestpw"
        val encoded = sut.encode(plainTextPassword)
        val matches = sut.matches(plainTextPassword, encoded)
        assertThat(encoded).isNotEqualTo(plainTextPassword)
        assertThat(matches).isTrue()
    }
}