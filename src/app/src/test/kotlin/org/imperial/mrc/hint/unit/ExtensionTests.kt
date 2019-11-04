package org.imperial.mrc.hint.unit

import com.github.kittinunf.fuel.core.Response
import org.assertj.core.api.Java6Assertions.assertThat
import org.imperial.mrc.hint.asResponseEntity
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
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

        res = Response(URL("http://whatever"), -1)
        assertThat(res.asResponseEntity().statusCode).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR)
        assertThat(res.asResponseEntity().body).isEqualTo("No response returned. The request may have timed out.")
    }
}