package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.AuthInterceptor
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.util.LinkedMultiValueMap

@ActiveProfiles(profiles = ["test"])
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class HintApplicationTests(@Autowired val restTemplate: TestRestTemplate) : IntegrationTests() {

    private fun authorize() {
        restTemplate.restTemplate.interceptors.add(AuthInterceptor(restTemplate))
    }

    @BeforeEach
    private fun clearAuth() {
        restTemplate.restTemplate.interceptors.clear()
    }

    @Test
    fun `unauthorized users are redirected to login page`() {
        val entity = restTemplate.getForEntity<String>("/")
        assertThat(entity.body!!).contains("<title>Login</title>")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `can login with correct credentials`() {
        authorize()
        val rootEntity = restTemplate.getForEntity<String>("/")
        assertThat(rootEntity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(rootEntity.body!!).contains("<a href=\"/logout\">Logout</a>")
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

    @Test
    fun `unauthorized users cannot access REST endpoints`() {
        val entity = restTemplate.getForEntity<String>("/baseline/")

        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.body!!).contains("<title>Login</title>")
    }

    @Test
    fun `authorized users can access REST endpoints`() {
        authorize()
        val entity = restTemplate.getForEntity<String>("/baseline/")

        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.body!!).isEqualTo("{\"errors\":{},\"status\":\"success\",\"data\":{\"pjnz\":null}}")
    }

    @Test
    fun `can get static resources`() {
        val entity = restTemplate.getForEntity<String>("/public/css/style.css")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
    }

}
