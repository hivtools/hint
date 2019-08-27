package org.imperial.mrc.hint.integration

import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.helpers.createTestHttpEntity
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.core.io.FileSystemResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.util.LinkedMultiValueMap
import java.io.File

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ExceptionHandlerTests(@Autowired val testRestTemplate: TestRestTemplate): IntegrationTests()  {

    @Test
    fun `route not found errors are correctly formatted`() {
        val entity = testRestTemplate.getForEntity("/nonsense/route/", String::class.java)
        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        JSONValidator().validateError(entity.body!!, "OTHER_ERROR", "No handler found for GET /nonsense/route/")
    }

    @Test
    fun `bad requests are correctly formatted`() {
        val testFile = File("$tmpUploadDirectory/whatever.csv")
        testFile.parentFile.mkdirs()
        testFile.createNewFile()
        val body = LinkedMultiValueMap<String, Any>()
        body.add("wrongPartName", FileSystemResource(testFile))
        val headers = HttpHeaders()
        headers.contentType = MediaType.MULTIPART_FORM_DATA
        val badPostEntity = HttpEntity(body, headers)

        val entity = testRestTemplate.postForEntity<String>("/disease/survey/", badPostEntity)
        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)
        JSONValidator().validateError(entity.body!!, "OTHER_ERROR", "Required request part 'file' is not present")
    }
}