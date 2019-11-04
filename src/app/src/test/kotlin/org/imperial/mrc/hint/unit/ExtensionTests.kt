package org.imperial.mrc.hint.unit

import com.github.kittinunf.fuel.core.Body
import com.github.kittinunf.fuel.core.Headers
import com.github.kittinunf.fuel.core.Response
import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Java6Assertions.assertThat
import org.imperial.mrc.hint.asResponseEntity
import org.imperial.mrc.hint.asStreamingResponseEntity
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import java.io.InputStream
import java.io.OutputStream
import java.net.URL

class ExtensionTests {

    @Test
    fun `response status code gets translated to HttpStatus`() {

        var res = Response(URL("http://whatever"), 200)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.OK)

        res = Response(URL("http://whatever"), 201)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.CREATED)

        res = Response(URL("http://whatever"), 400)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        res = Response(URL("http://whatever"), 401)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)

        res = Response(URL("http://whatever"), 403)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.FORBIDDEN)

        res = Response(URL("http://whatever"), 404)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.NOT_FOUND)

        res = Response(URL("http://whatever"), 500)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
    }

    @Test
    fun `asStreamingResponseEntity copies response to output stream`() {
        val mockInputStream = mock<InputStream>()
        val mockBody = mock<Body>{
            on { toStream() } doReturn mockInputStream
        }
        val headers = Headers()
        headers.append("test-header", "test-value")
        headers.append("test-header2", "test-value2")

        val response = Response(url=URL("http://test"), statusCode=200, headers=headers, body=mockBody)
        val result = response.asStreamingResponseEntity()

        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(result.headers["test-header"]?.first()).isEqualTo("test-value")
        assertThat(result.headers["test-header2"]?.first()).isEqualTo("test-value2")

        val mockOutputStream = mock<OutputStream>()
        val streamingBody = result.body
        //calling writeTo should invoke the copy from the input stream
        streamingBody?.writeTo(mockOutputStream)
        verify(mockInputStream).copyTo(mockOutputStream)
        verify(mockInputStream).close()
    }
}