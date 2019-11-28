package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap
import java.io.File

class HintApplicationTests : SecureIntegrationTests() {

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `unauthorized users are redirected to login page`(isAuthorized: IsAuthorized) {

        val rootEntity = testRestTemplate.getForEntity<String>("/")
        assertThat(rootEntity.statusCode).isEqualTo(HttpStatus.OK)
        if (isAuthorized == IsAuthorized.TRUE) {
            assertThat(rootEntity.body!!).doesNotContain("<title>Login</title>")
        } else {
            assertThat(rootEntity.body!!).contains("<title>Login</title>")
        }
    }

    @Test
    fun `redirect back to login page on login with incorrect correct credentials`() {
        val map = LinkedMultiValueMap<String, String>()
        map.add("username", "test.user@example.com")
        map.add("password", "badpassword")

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val entity = testRestTemplate.postForEntity<String>("/callback/", HttpEntity(map, headers))

        //test get redirected back to login page
        assertThat(entity.statusCode).isEqualTo(HttpStatus.FOUND)
        assertThat(entity.headers["Location"]!!.first())
                .isEqualTo("/login?username=test.user%40example.com&error=BadCredentialsException")
    }


    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `only authorized users can access REST endpoints`(isAuthorized: IsAuthorized) {
        val entity = testRestTemplate.getForEntity<String>("/baseline/pjnz/")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        if (isAuthorized == IsAuthorized.TRUE) {
            assertThat(entity.body!!).isEqualTo("{\"errors\":[],\"status\":\"success\",\"data\":null}")
        } else {
            assertThat(entity.body!!).contains("<title>Login</title>")
        }
    }

    @Test
    fun `can get static resources`() {
        val testCssFile = File("static/public/css").listFiles()!![0]
        val path = testCssFile.path.split("/").drop(1).joinToString("/")
        val entity = testRestTemplate.getForEntity<String>("/$path")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.headers.contentType!!.toString()).isEqualTo("text/css")
    }

    @Test
    fun `static responses are gzipped`() {
        val headers = HttpHeaders()
        headers.set("Accept-Encoding", "gzip")
        val entity = HttpEntity<String>(headers)
        val testCssFile = File("static/public/css").listFiles()!![0]
        val path = testCssFile.path.split("/").drop(1).joinToString("/")
        val response = testRestTemplate.exchange<String>("/$path", HttpMethod.GET, entity)
        assertThat(response.headers["Content-Encoding"]!!.first()).isEqualTo("gzip")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `api responses are gzipped`(isAuthorized: IsAuthorized) {
        val postEntity = getTestEntity("malawi.geojson", acceptGzip = true)
        val response = testRestTemplate.exchange<String>("/baseline/shape/", HttpMethod.POST, postEntity)

        if (isAuthorized == IsAuthorized.TRUE) {
            assertThat(response.headers["Content-Encoding"]!!.first()).isEqualTo("gzip")
        }
    }

}
