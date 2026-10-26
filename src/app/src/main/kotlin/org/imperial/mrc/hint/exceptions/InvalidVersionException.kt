package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

class InvalidVersionException : HintException("invalidVersion", HttpStatus.FORBIDDEN, errorCode = "INVALID_VERSION")
