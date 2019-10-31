package org.imperial.mrc.hint.models

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity

class ErrorDetail(private val httpStatus: HttpStatus, val detail: String) {

    val error = "OTHER_ERROR"
    fun toResponseEntity() = ResponseEntity
            .status(this.httpStatus)
            .contentType(MediaType.APPLICATION_JSON)
            .body(ObjectMapper().writeValueAsString(ErrorResponse(listOf(this))) as Any)
}
