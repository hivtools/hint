package org.imperial.mrc.hint.integration

import org.apache.http.impl.client.HttpClients
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.util.LinkedMultiValueMap
import java.io.File


class HintApplicationTests : SecureIntegrationTests()
{

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `all users can access index`(isAuthorized: IsAuthorized)
    {
        testAllUserAccess("/", isAuthorized)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `all users can access projects`(isAuthorized: IsAuthorized)
    {
        testAllUserAccess("/projects", isAuthorized)
    }

    @Test
    fun `all users can access metrics`()
    {
        val response = testRestTemplate.getForEntity<String>("/metrics")
        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).isEqualTo("running 1\nbusy_workers 0\nidle_workers 2\n" +
                "paused_workers 0\nexited_workers 0\nlost_workers 0\nlive_workers 2")
    }

    private fun testAllUserAccess(url: String, isAuthorized: IsAuthorized)
    {
        val rootEntity = testRestTemplate.getForEntity<String>(url)
        assertThat(rootEntity.statusCode).isEqualTo(HttpStatus.OK)
        if (isAuthorized == SecureIntegrationTests.IsAuthorized.TRUE)
        {
            assertThat(rootEntity.body!!).doesNotContain("<title>Login</title>")
            assertThat(rootEntity.body!!).contains("var currentUser = \"test.user@example.com\"")
        }
        else
        {
            assertThat(rootEntity.body!!).doesNotContain("<title>Login</title>")
            assertThat(rootEntity.body!!).contains("var currentUser = \"guest\"")
        }
    }

    @Test
    fun `redirect back to login page on login with incorrect correct credentials`()
    {
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
    fun `authorized users and guest user can access REST endpoints`(isAuthorized: IsAuthorized)
    {
        val entity = testRestTemplate.getForEntity<String>("/baseline/pjnz/")
        if (isAuthorized == IsAuthorized.TRUE)
        {
            assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(entity.body!!).isEqualTo("{\"errors\":[],\"status\":\"success\",\"data\":null}")
        }
        else
        {
            assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(entity.body!!).isEqualTo("{\"errors\":[],\"status\":\"success\",\"data\":null}")
        }
    }

    @Test
    fun `can get static resources`()
    {
        val testCssFile = File("static/public/css").listFiles()!!.find { it.extension == "css" }!!
        val path = testCssFile.path.split("/").drop(1).joinToString("/")
        val entity = testRestTemplate.getForEntity<String>("/$path")
        assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(entity.headers.contentType!!.toString()).isEqualTo("text/css")
    }

    @Test
    fun `static responses are gzipped`()
    {
        disableAutomaticDecompression()
        val headers = HttpHeaders()
        headers.set("Accept-Encoding", "gzip")
        val entity = HttpEntity<String>(headers)
        val testCssFile = File("static/public/css").listFiles()!!.find { it.extension == "css" }!!
        val path = testCssFile.path.split("/").drop(1).joinToString("/")
        val response = testRestTemplate.exchange<String>("/$path", HttpMethod.GET, entity)
        assertThat(response.headers["Content-Encoding"]!!.first()).isEqualTo("gzip")
    }

    @Test
    fun `api responses are gzipped`()
    {
        authorize()
        disableAutomaticDecompression()
        testRestTemplate.getForEntity<String>("/")
        val postEntity = getTestEntity("malawi.geojson", acceptGzip = true)
        val response = testRestTemplate.exchange<String>("/baseline/shape/", HttpMethod.POST, postEntity)
        assertThat(response.headers["Content-Encoding"]!!.first()).isEqualTo("gzip")
    }

    private fun disableAutomaticDecompression()
    {
        // the apache http client decompresses the response and removes the content encoding header by default
        val client = HttpClients.custom()
                .disableContentCompression()
                .build()
        testRestTemplate.restTemplate.requestFactory = HttpComponentsClientHttpRequestFactory(client)
    }

}
