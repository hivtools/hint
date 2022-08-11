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
import org.imperial.mrc.hint.asResponseEntity
import org.imperial.mrc.hint.getStreamingResponseEntity
import org.junit.jupiter.api.Assertions.*
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
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.OK)

        res = Response(URL("http://whatever"), 201, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.CREATED)

        res = Response(URL("http://whatever"), 400, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.BAD_REQUEST)

        res = Response(URL("http://whatever"), 401, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.UNAUTHORIZED)

        res = Response(URL("http://whatever"), 403, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.FORBIDDEN)

        res = Response(URL("http://whatever"), 404, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.NOT_FOUND)

        res = Response(URL("http://whatever"), 500, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.INTERNAL_SERVER_ERROR)

    }

    @Test
    fun `message is returned when status code is missing`() {
        val res = Response(URL("http://whatever"), -1)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.INTERNAL_SERVER_ERROR)
        val body = ObjectMapper().readTree(res.asResponseEntity().body)
        val errorDetail = body["errors"].first()["detail"].textValue()
        assertEquals(errorDetail, "No response returned. The request may have timed out.")
    }

    @Test
    fun `error is returned when response is not valid json`()
    {
        val mockBody = getMockBody("Bad response")
        val res = Response(URL("http://whatever"), 500, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.INTERNAL_SERVER_ERROR)
        val body = ObjectMapper().readTree(res.asResponseEntity().body)
        val errorDetail = body["errors"].first()["detail"].textValue()
        assertEquals(errorDetail, "Could not parse response.")
    }

    @Test
    fun `error is returned when response json does not conform to schema and status code greater than 400`()
    {
        val mockBody = getMockBody("{\"wrong\": \"schema\"}")
        val res = Response(URL("http://whatever"), 500, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.INTERNAL_SERVER_ERROR)
        val body = ObjectMapper().readTree(res.asResponseEntity().body)
        val error = body["errors"].first()["error"].textValue()
        assertEquals(error, "OTHER_ERROR")
    }

    @Test
    fun `returns OK when response json does not conform to schema and status code is less than 400`()
    {
        val mockBody = getMockBody("{\"wrong\": \"schema\"}")
        val res = Response(URL("http://whatever"), 204, body = mockBody)
        assertEquals(res.asResponseEntity().statusCode, HttpStatus.OK)
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
        assertEquals(res.asResponseEntity(mockLog).statusCode, HttpStatus.GATEWAY_TIMEOUT)
        val body = ObjectMapper().readTree(res.asResponseEntity().body)
        val errorDetail = body["errors"].first()["detail"].textValue()
        assertEquals(errorDetail, "ADR request timed out")

        verify(mockLog).error("ADR request timed out")
    }

    @Test
    fun `success message is logged for ADR response`()
    {
        val mockBody = getMockBody("""{"success": "true"}""")
        val mockLog = mock<Log>()
        val res = Response(URL("http://whatever"), 200, body = mockBody)
        assertEquals(res.asResponseEntity(mockLog).statusCode, HttpStatus.OK)

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

        assertEquals(result.statusCode, HttpStatus.OK)
        assertEquals(result.headers["test-header"]?.first(), "test-value")
        assertEquals(result.headers["test-header2"]?.first(), "test-value2")
        assert(result.body is StreamingResponseBody)
    }
}
