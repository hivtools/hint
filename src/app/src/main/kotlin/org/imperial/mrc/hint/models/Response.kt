package org.imperial.mrc.hint.models

data class SuccessResponse(val data: Any){
    val errors = listOf<ErrorDetail>()
    val status = "success"
}

data class ErrorResponse(val errors: List<ErrorDetail>) {
    val data = mapOf<Any, Any>()
    val status = "failure"
}
