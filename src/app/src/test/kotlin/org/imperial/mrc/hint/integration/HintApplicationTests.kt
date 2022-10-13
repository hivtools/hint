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

    private val expectedSuccessResponse = "{\"data\":null,\"errors\":[],\"status\":\"success\"}"

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `all users can access index`(isAuthorized: IsAuthorized)
    {
        testAllUserAccess("/", isAuthorized)
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `all users can access explore`(isAuthorized: IsAuthorized)
    {
        testAllUserAccess("/callback/explore", isAuthorized)
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
        assertThat(response.body).contains("running 1")
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

        val entity = testRestTemplate.postForEntity<String>("/callback/formClient", HttpEntity(map, headers))

        //test get redirected back to login page
        assertThat(entity.statusCode).isEqualTo(HttpStatus.SEE_OTHER)
        assertThat(entity.headers["Location"]!!.first())
                .isEqualTo("/login?username=test.user%40example.com&error=BadCredentialsException")
    }

    @Test
    fun `redirects to requested url after login`()
    {
        // set requested url
        val loginEntity = testRestTemplate.getForEntity<String>("/login?redirectTo=explore")

        val map = LinkedMultiValueMap<String, String>()
        map.add("username", "test.user@example.com")
        map.add("password", "password")

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        // make sure session is shared between requests
        val cookies = loginEntity.headers["Set-Cookie"]!!.first().split(";")
        val sessionCookie = cookies.first { it.startsWith("JSESSIONID") }.split("=")[1]
        headers.add("Cookie", "JSESSIONID=$sessionCookie")

        // login
        val callbackEntity = testRestTemplate.postForEntity<String>("/callback/formClient", HttpEntity(map, headers))

        // get redirected back to explore page
        assertThat(callbackEntity.statusCode).isEqualTo(HttpStatus.SEE_OTHER)
        assertThat(callbackEntity.headers["Location"]!!.first())
                .isEqualTo("/callback/explore")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `authorized users and guest user can access REST endpoints`(isAuthorized: IsAuthorized)
    {
        val entity = testRestTemplate.getForEntity<String>("/baseline/pjnz/")
        if (isAuthorized == IsAuthorized.TRUE)
        {
            assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(entity.body!!).isEqualTo(expectedSuccessResponse)
        }
        else
        {
            assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
            assertThat(entity.body!!).isEqualTo(expectedSuccessResponse)
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
