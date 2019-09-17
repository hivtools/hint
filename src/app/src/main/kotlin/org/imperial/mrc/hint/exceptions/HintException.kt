package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

open class HintException(message: String,
                         val httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR): Exception(message)