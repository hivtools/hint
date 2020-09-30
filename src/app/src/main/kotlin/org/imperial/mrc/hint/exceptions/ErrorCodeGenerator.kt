package org.imperial.mrc.hint.exceptions

import org.apache.commons.lang3.RandomStringUtils
import org.springframework.stereotype.Component

interface ErrorCodeGenerator
{
    fun newCode(): String
}

@Component
class RandomErrorCodeGenerator : ErrorCodeGenerator
{
    override fun newCode(): String
    {
        fun r(count: Int) = RandomStringUtils.randomAlphabetic(count).toLowerCase()
        return "u${r(2)}-${r(3)}-${r(3)}"
    }
}
