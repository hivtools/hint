package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

open class HintException(key: String, val httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR):
        Exception(key)