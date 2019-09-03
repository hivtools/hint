package org.imperial.mrc.hint.models

import com.fasterxml.jackson.databind.ObjectMapper

data class SuccessResponse(val data: Any?){
    val errors = listOf<ErrorDetail>()
    val status = "success"
}


fun SuccessResponse.toJsonString() = ObjectMapper().writeValueAsString(this)

val EmptySuccessResponse = SuccessResponse(true)

data class ErrorResponse(val errors: List<ErrorDetail>) {
    val data = null
    val status = "failure"
}
