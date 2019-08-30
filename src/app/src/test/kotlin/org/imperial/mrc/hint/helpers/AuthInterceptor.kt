package org.imperial.mrc.hint.helpers

import org.assertj.core.api.Assertions.assertThat
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.http.client.ClientHttpRequestExecution
import org.springframework.http.client.ClientHttpRequestInterceptor
import org.springframework.http.client.ClientHttpResponse
import org.springframework.util.LinkedMultiValueMap

class AuthInterceptor(restTemplate: TestRestTemplate, password: String = "password") : ClientHttpRequestInterceptor {

    private val sessionCookie: String

    init {
        val map = LinkedMultiValueMap<String, String>()
        map.add("username", "test.user@example.com")
        map.add("password", password)

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val entity = restTemplate.postForEntity<String>("/callback/", HttpEntity(map, headers))

        assertThat(entity.statusCode).isEqualTo(HttpStatus.FOUND)
        assertThat(entity.headers.location!!.toString()).isEqualTo("/")

        val cookies = entity.headers["Set-Cookie"]!!.first().split(";")
        this.sessionCookie = cookies.first { it.startsWith("JSESSIONID") }.split("=")[1]
    }

    override fun intercept(request: HttpRequest, body: ByteArray, execution: ClientHttpRequestExecution): ClientHttpResponse {
        request.headers.add("Cookie", "JSESSIONID=$sessionCookie")
        return execution.execute(request, body)
    }
}
