package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus

class ProjectException(key: String) : HintException(key, HttpStatus.BAD_REQUEST)
