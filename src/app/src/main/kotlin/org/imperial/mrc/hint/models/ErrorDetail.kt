package org.imperial.mrc.hint.models

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity

class ErrorDetail(private val httpStatus: HttpStatus,
                  val detail: String,
                  val trace: List<String> = listOf()) {

    val error = "OTHER_ERROR"
    fun toResponseEntity() = ResponseEntity
            .status(this.httpStatus)
            .contentType(MediaType.APPLICATION_JSON)
            .body(ErrorResponse(listOf(this)).toJsonString() as Any)
}
