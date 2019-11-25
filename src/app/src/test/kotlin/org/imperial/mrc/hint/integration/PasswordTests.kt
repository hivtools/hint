package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.emails.WriteToDiskEmailManager
import org.imperial.mrc.hint.helpers.AuthInterceptor
import org.imperial.mrc.hint.helpers.errorMessageRegex
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.util.LinkedMultiValueMap
import java.nio.file.Files

class PasswordTests(@Autowired val restTemplate: TestRestTemplate) : CleanDatabaseTests() {

    companion object {
        @BeforeAll
        @JvmStatic
        fun setUp() {
            WriteToDiskEmailManager.cleanOutputDirectory()
        }
    }

    private val expectedSuccessResponse = "{\"errors\":[],\"status\":\"success\",\"data\":true}"

    private fun expectedErrorResponse(errorMessage: String): String {
        return "{\"data\":{},\"status\":\"failure\",\"errors\":[{\"error\":\"OTHER_ERROR\",\"detail\":\"$errorMessage\"}]}"
    }

    @AfterEach
    override fun tearDown() {
        super.tearDown()
        WriteToDiskEmailManager.cleanOutputDirectory()
    }

    @Test
    fun `request reset password link generates email to disk`() {
        val lines = requestPasswordResetLinkAndReadEmail()

        assertThat(lines.contains("This is an automated email from HINT. We have received a request to reset the" +
                " password for the account with\n" +
                "this email address (test.user@example.com)."))

    }

    @Test
    fun `can reset password with valid token`() {
        val lines = requestPasswordResetLinkAndReadEmail()
        val token = getTokenFromEmailText(lines)

        val map = LinkedMultiValueMap<String, String>()
        map.add("token", token)
        map.add("password", "newpassword")

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        var entity = restTemplate.postForEntity<String>("/password/reset-password/",
                HttpEntity(map, headers))
        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
        Assertions.assertThat(entity.body).isEqualTo(expectedSuccessResponse)

        restTemplate.restTemplate.interceptors.add(AuthInterceptor(restTemplate, "newpassword"))
        entity = restTemplate.getForEntity<String>("/")
        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)
    }

    @Test
    fun `cannot reset password with invalid token`() {
        val map = LinkedMultiValueMap<String, String>()
        map.add("token", "blah")
        map.add("password", "newpassword")

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val entity = restTemplate.postForEntity<String>("/password/reset-password/",
                HttpEntity(map, headers))

        assertThat(entity.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        assertThat(entity.body).isEqualTo(expectedErrorResponse("Token is not valid"))
    }

    @Test
    fun `cannot reset password which is too short`() {
        val lines = requestPasswordResetLinkAndReadEmail()
        val token = getTokenFromEmailText(lines)

        val map = LinkedMultiValueMap<String, String>()
        map.add("token", token)
        map.add("password", "new")

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val entity = restTemplate.postForEntity<String>("/password/reset-password/",
                HttpEntity(map, headers))
        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        Assertions.assertThat(entity.body).isEqualTo(expectedErrorResponse("postResetPassword.password: Password must be at least 6 characters long"))
    }

    private fun getTokenFromEmailText(emailText: String): String {
        val regex = Regex("token=(.*)\\n")
        val match = regex.find(emailText)
        return match!!.groups[1]!!.value
    }

    private fun requestPasswordResetLinkAndReadEmail(): String {
        val map = LinkedMultiValueMap<String, String>()
        map.add("email", "test.user@example.com")

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val entity = restTemplate.postForEntity<String>("/password/request-reset-link/",
                HttpEntity(map, headers))
        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.OK)

        //Check that a file has been written to the tmp directory
        val dir = WriteToDiskEmailManager.outputDirectory
        val files = dir.listFiles()
        assertThat(files.count()).isEqualTo(1)

        return Files.readAllLines(files[0].toPath()).joinToString(separator = "\n")
    }

}