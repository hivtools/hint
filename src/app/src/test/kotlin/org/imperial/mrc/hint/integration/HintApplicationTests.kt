package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.test.context.ActiveProfiles
import org.springframework.util.LinkedMultiValueMap


@ActiveProfiles(profiles=["test"])
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HintApplicationTests(@Autowired val restTemplate: TestRestTemplate) {

    @Test
    fun contextLoads() {
    }

    @Test
    fun `Assert redirects to login page`() {
        val entity = restTemplate.getForEntity<String>("/")
        assertThat(entity.body!!).contains("Log In")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `can login with correct credentials`() {
        val map = LinkedMultiValueMap<String, String>()
        map.add("username", "test.user@example.com")
        map.add("password", "password")

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val entity = restTemplate.postForEntity<String>("/callback/", HttpEntity(map, headers))

        //test get redirected to '/'
        assertThat(entity.statusCode).isEqualTo(HttpStatus.FOUND)
        assertThat(entity.headers["Location"]!!.first()).isEqualTo("/")

        val cookies = entity.headers["Set-Cookie"]!!.first().split(";")
        val sessionCookie = cookies.first{it.startsWith("JSESSIONID")}.split("=")[1]

        //Assert can access '/' using the cookie
        val rootHeaders = HttpHeaders()
        rootHeaders.put("Cookie", listOf("JSESSIONID=" + sessionCookie))
        val getRootEntity = HttpEntity(null, rootHeaders)
        val rootEntity = restTemplate.exchange("/", HttpMethod.GET, getRootEntity, String::class.java)

        assertThat(rootEntity.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `redirect back to login page on login with incorrect correct credentials`() {
        val map = LinkedMultiValueMap<String, String>()
        map.add("username", "test.user@example.com")
        map.add("password", "badpassword")

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val entity = restTemplate.postForEntity<String>("/callback/", HttpEntity(map, headers))

        //test get redirected back to login page
        assertThat(entity.statusCode).isEqualTo(HttpStatus.FOUND)
        assertThat(entity.headers["Location"]!!.first())
                .isEqualTo("/login?username=test.user%40example.com&error=BadCredentialsException")
    }

}
