package org.imperial.mrc.hint

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.core.Response
import org.imperial.mrc.hint.models.ErrorResponse
import org.imperial.mrc.hint.models.SuccessResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

fun Response.asResponseEntity(): ResponseEntity<String> {

    val httpStatus = when (this.statusCode) {
        200 -> HttpStatus.OK
        201 -> HttpStatus.CREATED
        400 -> HttpStatus.BAD_REQUEST
        401 -> HttpStatus.UNAUTHORIZED
        403 -> HttpStatus.FORBIDDEN
        404 -> HttpStatus.NOT_FOUND
        else -> HttpStatus.INTERNAL_SERVER_ERROR
    }

    val body = this.body().asString("application/json")
    return ResponseEntity(body, httpStatus)
}
