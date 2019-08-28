package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.emails.WriteToDiskEmailManager
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.junit.jupiter.SpringExtension
import org.springframework.transaction.annotation.Transactional
import org.springframework.util.LinkedMultiValueMap
import java.nio.file.Files

@ExtendWith(SpringExtension::class)
@Transactional
class PasswordTests(@Autowired val restTemplate: TestRestTemplate): IntegrationTests() {

    companion object {
        @BeforeAll
        @JvmStatic
        fun setUp() {
            WriteToDiskEmailManager.cleanOutputDirectory()
        }
    }

    @AfterEach
    override fun tearDown() {
        super.tearDown()
        WriteToDiskEmailManager.cleanOutputDirectory()
    }

    @Test
    fun `request reset password link generates email to disk`() {
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

        val lines = Files.readAllLines(files[0].toPath()).joinToString(separator ="\n")
        assertThat(lines.contains("This is an automated email from HINT. We have received a request to reset the" +
                " password for the account with\n" +
                "this email address (test.user@example.com)."))

    }

}