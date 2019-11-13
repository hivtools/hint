package org.imperial.mrc.hint

import com.github.kittinunf.fuel.core.Headers
import com.github.kittinunf.fuel.core.Response
import com.github.kittinunf.fuel.core.Request
import com.github.kittinunf.fuel.core.requests.DownloadRequest
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.io.OutputStream


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

fun Request.getStreamingResponseEntity(): ResponseEntity<StreamingResponseBody> {

    val responseBody = StreamingResponseBody { outputStream: OutputStream ->
        //return an empty input stream to the body - don't need to re-use it
        val returnEmptyInputStream: () -> InputStream = { ByteArrayInputStream(ByteArray(0)) }
        (this as DownloadRequest).streamDestination{ _, _ -> Pair(outputStream, returnEmptyInputStream) }
                .response()
    }

    val response = this.response()
            .second

    val httpStatus = httpStatusFromCode(response.statusCode)
    val headers = headersToMultiMap(response.headers)

    return ResponseEntity(responseBody, headers, httpStatus)
}
