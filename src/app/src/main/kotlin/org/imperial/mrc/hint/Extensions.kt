package org.imperial.mrc.hint

import com.github.kittinunf.fuel.core.Response
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
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

    var body = this.body().asString("application/json")
    if (this.statusCode == -1) {
        body = "No response returned. The request may have timed out."
    }
    return ResponseEntity.status(httpStatus)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
}
