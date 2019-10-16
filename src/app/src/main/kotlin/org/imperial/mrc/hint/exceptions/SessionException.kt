package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

class SessionException(message: String) : HintException(message, HttpStatus.BAD_REQUEST)