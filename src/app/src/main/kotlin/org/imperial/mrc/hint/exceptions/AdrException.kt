package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

class AdrException(
    key: String,
    status: HttpStatus,
    url: Array<String> = arrayOf("")
) : HintException(key, status, url)
