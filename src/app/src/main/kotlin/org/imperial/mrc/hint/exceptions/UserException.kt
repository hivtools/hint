package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

class UserException(key: String): HintException(key, HttpStatus.BAD_REQUEST)