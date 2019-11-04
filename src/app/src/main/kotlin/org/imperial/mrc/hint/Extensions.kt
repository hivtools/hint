package org.imperial.mrc.hint

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.core.Response
import org.imperial.mrc.hint.models.ErrorDetail
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import java.io.IOException

@Suppress("UNCHECKED_CAST")
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

    if (this.statusCode == -1) {
        return ErrorDetail(httpStatus, "No response returned. The request may have timed out.")
                .toResponseEntity() as ResponseEntity<String>
    }

    try {
        val body = this.body().asString("application/json")
        val json = ObjectMapper().readTree(body)
        if (!json.has("status")) {
            return ErrorDetail(httpStatus, "Could not parse response.")
                    .toResponseEntity() as ResponseEntity<String>
        }
        return ResponseEntity.status(httpStatus)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
    } catch (e: IOException) {
        return ErrorDetail(httpStatus, "Could not parse response.")
                .toResponseEntity() as ResponseEntity<String>
    }
}
