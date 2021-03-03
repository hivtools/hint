package org.imperial.mrc.hint.models

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity

class ErrorDetail(private val httpStatus: HttpStatus,
                  val detail: String,
                  val error: String = defaultError,
                  val trace: List<String>? = null)
{

    companion object
    {
        const val defaultError = "OTHER_ERROR"
    }

    fun <T> toResponseEntity() = ResponseEntity
            .status(this.httpStatus)
            .contentType(MediaType.APPLICATION_JSON)
            .body(ErrorResponse(listOf(this)).toJsonString() as T)
}
