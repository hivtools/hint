package org.imperial.mrc.hint

import com.github.kittinunf.fuel.core.Headers
import com.github.kittinunf.fuel.core.Response
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap

fun httpStatusFromCode(code: Int): HttpStatus {
    return when (code) {
        200 -> HttpStatus.OK
        201 -> HttpStatus.CREATED
        400 -> HttpStatus.BAD_REQUEST
        401 -> HttpStatus.UNAUTHORIZED
        403 -> HttpStatus.FORBIDDEN
        404 -> HttpStatus.NOT_FOUND
        else -> HttpStatus.INTERNAL_SERVER_ERROR
    }
}

fun headersToMultiMap(headers: Headers): MultiValueMap<String, String> {
    val result = LinkedMultiValueMap<String, String>()
    headers.entries.forEach {
        result.addAll(it.key, it.value.toList());
    }
    return result;
}

fun Response.asResponseEntity(): ResponseEntity<String> {
    val httpStatus = httpStatusFromCode(this.statusCode)

    val body = this.body().asString("application/json")
    return ResponseEntity.status(httpStatus)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
}

fun Response.asByteArrayResponseEntity(): ResponseEntity<ByteArray> {
    val httpStatus = httpStatusFromCode(this.statusCode)
    val body = this.body().toByteArray();
    val headers = headersToMultiMap(this.headers);
    return ResponseEntity(body, headers, httpStatus);
}
