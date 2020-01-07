package org.imperial.mrc.hint.integration

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.imperial.mrc.hint.exceptions.ErrorCodeGenerator
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.exceptions.HintExceptionHandler
import org.imperial.mrc.hint.exceptions.RandomErrorCodeGenerator
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.imperial.mrc.hint.helpers.unexpectedErrorRegex
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.postgresql.util.PSQLException
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.core.io.FileSystemResource
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.converter.HttpMessageNotWritableException
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.context.request.WebRequest
import java.io.File

class ExceptionHandlerTests : SecureIntegrationTests() {

    private val mockException = mock<HttpMessageNotWritableException>()

    @Test
    fun `route not found errors are correctly formatted`() {
        val entity = testRestTemplate.getForEntity("/nonsense/route/", String::class.java)
        Assertions.assertThat(entity.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        JSONValidator().validateError(entity.body!!,
                "OTHER_ERROR",
                unexpectedErrorRegex,
                "No handler found for GET /nonsense/route/")
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `bad requests are correctly formatted`(isAuthorized: IsAuthorized) {
        val testFile = File("$tmpUploadDirectory/whatever.csv")
        testFile.parentFile.mkdirs()
        testFile.createNewFile()
        val body = LinkedMultiValueMap<String, Any>()
        body.add("wrongPartName", FileSystemResource(testFile))
        val headers = HttpHeaders()
        headers.contentType = MediaType.MULTIPART_FORM_DATA
        val badPostEntity = HttpEntity(body, headers)

        val entity = testRestTemplate.postForEntity<String>("/disease/survey/", badPostEntity)

        assertSecureWithError(isAuthorized,
                entity,
                HttpStatus.BAD_REQUEST,
                "OTHER_ERROR",
                unexpectedErrorRegex,
                "Required request part 'file' is not present")
    }

    @Test
    fun `unexpected errors are correctly formatted`() {
        val mockErrorCodeGenerator = mock<ErrorCodeGenerator> {
            on { newCode() } doReturn "1234"
        }
        val mockProperties = mock<AppProperties> {
            on { applicationTitle } doReturn "AppTitle"
            on { supportEmail } doReturn "support@email.com"
        }
        val sut = HintExceptionHandler(mockErrorCodeGenerator, mockProperties)
        val result = sut.handleException(mockException, mock())
        JSONValidator().validateError(result!!.body!!.toString(),
                "OTHER_ERROR",
                "An unexpected error occurred. If you see this message while you are using AppTitle at a workshop, " +
                        "please contact your workshop technical support and show them this code: 1234. " +
                        "Otherwise please contact support at support@email.com and quote this code: 1234")
    }

    @Test
    fun `unexpected error message is translated if language accept header is passed`() {
        val mockErrorCodeGenerator = mock<ErrorCodeGenerator> {
            on { newCode() } doReturn "1234"
        }
        val mockProperties = mock<AppProperties> {
            on { applicationTitle } doReturn "AppTitle"
            on { supportEmail } doReturn "support@email.com"
        }
        val mockRequest = mock<WebRequest> {
            on { getHeader("Accept-Language") } doReturn "fr"
        }
        val sut = HintExceptionHandler(mockErrorCodeGenerator, mockProperties)
        val result = sut.handleException(mockException, mockRequest)
        JSONValidator().validateError(result!!.body!!.toString(),
                "OTHER_ERROR",
                "Une erreur inattendue s'est produite. Si vous voyez ce message pendant que vous utilisez AppTitle dans un atelier, " +
                        "veuillez contacter le support technique de votre atelier et leur indiquer ce code : 1234. " +
                        " Sinon, veuillez contacter le support à support@email.com et citer ce code : 1234")
    }

    @Test
    fun `unexpected error message is in english if no translations are available`() {
        val mockErrorCodeGenerator = mock<ErrorCodeGenerator> {
            on { newCode() } doReturn "1234"
        }
        val mockProperties = mock<AppProperties> {
            on { applicationTitle } doReturn "AppTitle"
            on { supportEmail } doReturn "support@email.com"
        }
        val mockRequest = mock<WebRequest> {
            on { getHeader("Accept-Language") } doReturn "de"
        }
        val sut = HintExceptionHandler(mockErrorCodeGenerator, mockProperties)
        val result = sut.handleException(mockException, mockRequest)
        JSONValidator().validateError(result!!.body!!.toString(),
                "OTHER_ERROR",
                "An unexpected error occurred. If you see this message while you are using AppTitle at a workshop, " +
                        "please contact your workshop technical support and show them this code: 1234. " +
                        "Otherwise please contact support at support@email.com and quote this code: 1234")
    }

    @Test
    fun `translated error message falls back to key if no value is present`() {
        val sut = HintExceptionHandler(mock(), mock())
        val result = sut.handleHintException(HintException("badKey"), mock())
        JSONValidator().validateError(result.body!!.toString(),
                "OTHER_ERROR",
                "badKey")
    }

    @Test
    fun `does not include original message from psql exceptions`() {
        val sut = HintExceptionHandler(RandomErrorCodeGenerator(), ConfiguredAppProperties())
        val result = sut.handlePSQLException(PSQLException("some message", mock()), mock())
        JSONValidator().validateError(result.body!!.toString(),
                "OTHER_ERROR",
                unexpectedErrorRegex)
        assertThat(result.body!!.toString()).doesNotContain("trace")
    }

}