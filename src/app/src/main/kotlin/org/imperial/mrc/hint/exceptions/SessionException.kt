package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

class SessionException(key: String) : HintException(key, HttpStatus.BAD_REQUEST)
