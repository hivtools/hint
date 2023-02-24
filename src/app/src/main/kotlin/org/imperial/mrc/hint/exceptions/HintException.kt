package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

open class HintException(
        val key: String,
        val httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        val args: Array<String> = arrayOf("")
) : Exception("HintException with key $key")
