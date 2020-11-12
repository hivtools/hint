package org.imperial.mrc.hint

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.core.Headers
import com.github.kittinunf.fuel.core.Parameters
import com.github.kittinunf.fuel.core.Request
import com.github.kittinunf.fuel.core.Response
import com.github.kittinunf.fuel.core.requests.DownloadRequest
import org.apache.commons.logging.LogFactory
import org.imperial.mrc.hint.exceptions.HintExceptionHandler
import org.imperial.mrc.hint.models.ErrorDetail
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.io.ByteArrayInputStream
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream

fun httpStatusFromCode(code: Int): HttpStatus {
    val status = HttpStatus.resolve(code) ?: return HttpStatus.INTERNAL_SERVER_ERROR
    return if (status <= HttpStatus.NOT_FOUND) {
        status
    } else {
        HttpStatus.INTERNAL_SERVER_ERROR
    }
}

fun headersToMultiMap(headers: Headers): MultiValueMap<String, String> {
    val result = LinkedMultiValueMap<String, String>()
    headers.entries.forEach {
        result.addAll(it.key, it.value.toList())
    }
    return result
}

@Suppress("UNCHECKED_CAST")
fun Response.asResponseEntity(): ResponseEntity<String> {
    val httpStatus = httpStatusFromCode(this.statusCode)

    if (this.statusCode == -1) {
        return ErrorDetail(httpStatus, "No response returned. The request may have timed out.")
                .toResponseEntity() as ResponseEntity<String>
    }

    return try {
        val body = this.body().asString("application/json")
        val json = ObjectMapper().readTree(body)
        if (!json.has("status") && !json.has("success")) {
            throw IOException()
        }
        return if (json.has("status")) {
            // this is a hintr response, so already conforms to our response schema
            ResponseEntity.status(httpStatus)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
        } else {
            // this is an ADR response, so convert to our response schema
            formatADRResponse(json)
        }

    } catch (e: IOException) {
        LogFactory.getLog(HintExceptionHandler::class.java).error(e.message)
        ErrorDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Could not parse response.")
                .toResponseEntity() as ResponseEntity<String>
    }
}

@Suppress("UNCHECKED_CAST")
fun formatADRResponse(json: JsonNode): ResponseEntity<String> {

    return if (json["success"].asBoolean()) {
        SuccessResponse(json["result"])
                .asResponseEntity()
    } else {
        // ckan API always returns a 200, even when the request errors,
        // so just return a 500 for every error response
        ErrorDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                json["error"]["message"].asText(),
                "ADR_ERROR")
                .toResponseEntity() as ResponseEntity<String>
    }

}

fun Request.getStreamingResponseEntity(headRequest: (url: String, parameters: Parameters?) -> Request)
        : ResponseEntity<StreamingResponseBody> {

    val responseBody = StreamingResponseBody { outputStream: OutputStream ->
        //return an empty input stream to the body - don't need to re-use it
        val returnEmptyInputStream: () -> InputStream = { ByteArrayInputStream(ByteArray(0)) }
        (this as DownloadRequest).streamDestination { _, _ -> Pair(outputStream, returnEmptyInputStream) }
                .response()
    }

    val headReq = headRequest(this.url.toString(), null)
    val response = headReq.response()
            .second

    val httpStatus = httpStatusFromCode(response.statusCode)
    val headers = headersToMultiMap(response.headers)

    return ResponseEntity(responseBody, headers, httpStatus)
}

