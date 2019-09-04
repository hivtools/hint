package org.imperial.mrc.hint.models

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

data class SuccessResponse(val data: Any?){
    val errors = arrayOf<Any>()
    val status = "success"
}

fun SuccessResponse.toJsonString() = ObjectMapper().writeValueAsString(this)
fun SuccessResponse.asResponseEntity() = ResponseEntity(this.toJsonString(), HttpStatus.OK)

val EmptySuccessResponse = SuccessResponse(true)

data class ErrorResponse(val errors: List<ErrorDetail>) {
    val data = mapOf<Any, Any>()
    val status = "failure"
}
