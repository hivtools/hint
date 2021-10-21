package org.imperial.mrc.hint.unit

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.core.Body
import com.github.kittinunf.fuel.core.Headers
import com.github.kittinunf.fuel.core.Request
import com.github.kittinunf.fuel.core.Response
import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.apache.commons.logging.Log
import org.assertj.core.api.Java6Assertions.assertThat
import org.imperial.mrc.hint.asResponseEntity
import org.imperial.mrc.hint.getStreamingResponseEntity
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.net.URL

class ExtensionTests {

    private fun getMockBody(bodyString: String): Body
    {
        return mock<Body> {
            on { it.asString(any()) } doReturn bodyString
            on { it.asString(null) } doReturn bodyString
        }
    }

    @Test
    fun `response status code gets translated to HttpStatus`() {

        val mockBody = mock<Body> {
            on { it.asString(any()) } doReturn "{\"status\": \"success\"}"
        }
        var res = Response(URL("http://whatever"), 200, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.OK)

        res = Response(URL("http://whatever"), 201, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.CREATED)

        res = Response(URL("http://whatever"), 400, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        res = Response(URL("http://whatever"), 401, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)

        res = Response(URL("http://whatever"), 403, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.FORBIDDEN)

        res = Response(URL("http://whatever"), 404, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.NOT_FOUND)

        res = Response(URL("http://whatever"), 500, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)

    }

    @Test
    fun `message is returned when status code is missing`() {
        val res = Response(URL("http://whatever"), -1)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
        val body = ObjectMapper().readTree(res.asResponseEntity().body)
        val errorDetail = body["errors"].first()["detail"].textValue()
        assertThat(errorDetail).isEqualTo("No response returned. The request may have timed out.")
    }

    @Test
    fun `error is returned when response is not valid json`()
    {
        val mockBody = getMockBody("Bad response")
        val res = Response(URL("http://whatever"), 500, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
        val body = ObjectMapper().readTree(res.asResponseEntity().body)
        val errorDetail = body["errors"].first()["detail"].textValue()
        assertThat(errorDetail).isEqualTo("Could not parse response.")
    }

    @Test
    fun `error is returned when response json does not conform to schema and status code greater than 400`()
    {
        val mockBody = getMockBody("{\"wrong\": \"schema\"}")
        val res = Response(URL("http://whatever"), 500, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
        val body = ObjectMapper().readTree(res.asResponseEntity().body)
        val error = body["errors"].first()["error"].textValue()
        assertThat(error).isEqualTo("OTHER_ERROR")
    }

    @Test
    fun `returns OK when response json does not conform to schema and status code is less than 400`()
    {
        val mockBody = getMockBody("{\"wrong\": \"schema\"}")
        val res = Response(URL("http://whatever"), 204, body = mockBody)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `expected error is returned on HTML Gateway Time-out response`()
    {
        val mockBody = getMockBody("""<html
                <head><title>504 Gateway Time-out</title></head>
                <body>
                <center><h1>504 Gateway Time-out</h1></center>
                </body>
                </html>
                """)

        val mockLog = mock<Log>()

        val res = Response(URL("http://whatever"), 200, body = mockBody)
        assertThat(res.asResponseEntity(mockLog).statusCode).isEqualTo(HttpStatus.GATEWAY_TIMEOUT)
        val body = ObjectMapper().readTree(res.asResponseEntity().body)
        val errorDetail = body["errors"].first()["detail"].textValue()
        assertThat(errorDetail).isEqualTo("ADR request timed out")

        verify(mockLog).error("ADR request timed out")
    }

    @Test
    fun `success message is logged for ADR response`()
    {
        val mockBody = getMockBody("""{"success": "true"}""")
        val mockLog = mock<Log>()
        val res = Response(URL("http://whatever"), 200, body = mockBody)
        assertThat(res.asResponseEntity(mockLog).statusCode).isEqualTo(HttpStatus.OK)

        verify(mockLog).info("ADR request successful")
    }

    @Test
    fun `getStreamingResponseEntity sets status, headers and streaming response`() {
        val headers = Headers()
        headers.append("test-header", "test-value")
        headers.append("test-header2", "test-value2")

        val response = Response(URL("http://test"), 200, "test msg", headers)

        val downloadRequest = mock<Request> {
            on { url } doReturn URL("http://test")
        }

        val mockHeadRequest = mock<Request> {
            on { response() } doReturn Triple(mock(), response, mock())
        }

        val result = downloadRequest.getStreamingResponseEntity({ _, _ -> mockHeadRequest })

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.headers["test-header"]?.first()).isEqualTo("test-value")
        assertThat(result.headers["test-header2"]?.first()).isEqualTo("test-value2")
        assertThat(result.body).isInstanceOf(StreamingResponseBody::class.java)
    }
}
