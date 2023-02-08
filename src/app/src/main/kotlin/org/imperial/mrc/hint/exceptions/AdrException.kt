package org.imperial.mrc.hint.exceptions

import org.springframework.http.HttpStatus
import java.net.URI

class AdrException(key: String, status: HttpStatus, uri: URI) : HintException(key, status, uri)