package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

class CalibrateDataException(
    key: String,
    args: Array<String> = arrayOf("")) : HintException(key, HttpStatus.BAD_REQUEST, args)
