package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus
import java.net.URI

open class HintException(
        val key: String,
        val httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        val adrUri: URI? = null
) : Exception("HintException with key $key")
