package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.node.ArrayNode
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.Tables.VERSION_FILE
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.helpers.getJsonEntity
import org.imperial.mrc.hint.helpers.getTestEntity
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.client.ClientHttpRequestExecution
import org.springframework.http.client.ClientHttpRequestInterceptor
import org.springframework.http.client.ClientHttpResponse
import org.springframework.util.LinkedMultiValueMap

class VersionHeaderTests : SecureIntegrationTests()
{
    @Autowired
    private lateinit var projectRepo: ProjectRepository

    @Autowired
    private lateinit var versionRepo: VersionRepository

    private fun versionHeader(versionId: String) = HttpHeaders().apply { set("X-Version-Id", versionId) }

    private fun uploadPjnz(versionId: String?): ResponseEntity<String>
    {
        val entity = getTestEntity("Malawi2024.PJNZ")
        val headers = HttpHeaders()
        headers.putAll(entity.headers)
        if (versionId != null)
        {
            headers.set("X-Version-Id", versionId)
        }
        return testRestTemplate.postForEntity<String>("/baseline/pjnz/", HttpEntity(entity.body, headers))
    }

    private fun versionOfFiles(): List<String>
    {
        return dsl.select(VERSION_FILE.VERSION).from(VERSION_FILE).fetch().map { it[VERSION_FILE.VERSION] }
    }

    private fun createProjectAndGetVersionId(): String
    {
        val entity = getJsonEntity(mapOf("name" to "testProject"))
        val result = testRestTemplate.postForEntity<String>("/project/", entity)
        val versions = getResponseData(result)["versions"] as ArrayNode
        return versions[0]["id"].asText()
    }

    @Test
    fun `logged in user can work on a version in the header, not the one in the session`()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
        // the session's own version is a different one, created by the first page load
        val first = createProjectAndGetVersionId()
        val second = createProjectAndGetVersionId()

        // the session now points at `second`, but the tab says `first`
        val result = uploadPjnz(first)

        assertSuccess(result, null)
        assertThat(versionOfFiles()).containsExactly(first)
        assertThat(first).isNotEqualTo(second)
    }

    @Test
    fun `logged in user cannot use a version that belongs to someone else`()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
        userRepo.addUser("other.user@example.com", "password")
        val otherProject = projectRepo.saveNewProject("other.user@example.com", "other")
        versionRepo.saveVersion("other-users-version", otherProject)

        val result = uploadPjnz("other-users-version")

        assertError(result, HttpStatus.FORBIDDEN, "INVALID_VERSION")
        assertThat(versionOfFiles()).isEmpty()
    }

    @Test
    fun `logged in user cannot use a version that does not exist`()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")

        assertError(uploadPjnz("nonexistent"), HttpStatus.FORBIDDEN, "INVALID_VERSION")
    }

    @Test
    fun `without the header the version in the session is still used`()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")

        assertSuccess(uploadPjnz(null), null)

        assertThat(versionOfFiles()).hasSize(1)
    }

    @Test
    fun `current project comes from the version header`()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
        val first = createProjectAndGetVersionId()
        createProjectAndGetVersionId()

        val result = testRestTemplate.exchange<String>("/project/current", HttpMethod.GET,
            HttpEntity<Any>(versionHeader(first)))

        assertThat(getResponseData(result)["version"]["id"].asText()).isEqualTo(first)
    }

    @Test
    fun `current project is null if the version header is not the users`()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
        createProjectAndGetVersionId()

        val result = testRestTemplate.exchange<String>("/project/current", HttpMethod.GET,
            HttpEntity<Any>(versionHeader("nonexistent")))

        assertThat(getResponseData(result)["project"].isNull).isTrue()
        assertThat(getResponseData(result)["version"].isNull).isTrue()
    }

    @Test
    fun `guest can create versions and work on them through the header`()
    {
        testRestTemplate.restTemplate.interceptors.add(CookieInterceptor())
        testRestTemplate.getForEntity<String>("/")

        val first = createGuestVersion()
        val second = createGuestVersion()
        assertThat(first).isNotEqualTo(second)

        assertSuccess(uploadPjnz(first), null)
        assertThat(versionOfFiles()).containsExactly(first)
    }

    @Test
    fun `guest cannot use a version it was not given`()
    {
        testRestTemplate.restTemplate.interceptors.add(CookieInterceptor())
        testRestTemplate.getForEntity<String>("/")
        versionRepo.saveVersion("someone-elses-guest-version", null)

        assertError(uploadPjnz("someone-elses-guest-version"), HttpStatus.FORBIDDEN, "INVALID_VERSION")
        assertThat(versionOfFiles()).isEmpty()
    }

    @Test
    fun `logged in user cannot create a guest version`()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")

        val result = testRestTemplate.postForEntity<String>("/guest/version", HttpEntity<Any>(HttpHeaders()))

        assertError(result, HttpStatus.FORBIDDEN, "OTHER_ERROR")
    }

    private fun createGuestVersion(): String
    {
        val result = testRestTemplate.postForEntity<String>("/guest/version", HttpEntity<Any>(HttpHeaders()))
        assertSuccess(result, null)
        return getResponseData(result)["id"].asText()
    }

    // The anonymous test client does not keep cookies, but the guest's version list lives in its session
    private class CookieInterceptor : ClientHttpRequestInterceptor
    {
        private var cookie: String? = null

        override fun intercept(request: HttpRequest, body: ByteArray, execution: ClientHttpRequestExecution): ClientHttpResponse
        {
            cookie?.let { request.headers.set("Cookie", it) }
            val response = execution.execute(request, body)
            response.headers["Set-Cookie"]?.firstOrNull { it.startsWith("JSESSIONID") }?.let {
                cookie = it.split(";").first()
            }
            return response
        }
    }
}
