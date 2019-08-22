package org.imperial.mrc.hint.unit.security

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.security.tokens.deflated
import org.imperial.mrc.hint.security.tokens.inflate
import org.imperial.mrc.hint.security.tokens.inflated
import org.junit.jupiter.api.Test

class GZipHelpersTests
{
    private val testString = """COMPRESSION:
        1 a : the act, process, or result of compressing
          b : the state of being compressed
        2   : the process of compressing the fuel mixture in a cylinder
              of an internal combustion engine (as in an automobile)
        3   : the compressed remains of a fossil plant
        4   : conversion (as of data, a data file, or a communications signal)
              in order to reduce the space occupied or bandwidth required"""

    @Test
    fun `can deflate and re-inflate text`()
    {
        assertThat(testString.deflated().inflated()).isEqualTo(testString)
    }

    @Test
    fun `deflated text is shorter`()
    {
        assertThat(testString.deflated().length).isLessThan(testString.length)
    }

    @Test
    fun `can inflate more than once`()
    {
        assertThat(inflate(inflate(testString.deflated()))).isEqualTo(testString)
    }

    @Test
    fun `can inflate non-compressed string`()
    {
        assertThat(inflate(testString)).isEqualTo(testString)
    }

    @Test
    fun `can inflate nullable string`()
    {
        assertThat(inflate(null as String?)).isNull()
    }
}