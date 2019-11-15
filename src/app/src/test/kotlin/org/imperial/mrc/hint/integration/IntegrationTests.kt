package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.helpers.AuthInterceptor
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInfo
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.test.context.ActiveProfiles
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.io.File

@ActiveProfiles(profiles = ["test"])
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
abstract class IntegrationTests {

    @AfterEach
    fun tearDown() {
        File(tmpUploadDirectory).deleteRecursively()
    }
}

abstract class SecureIntegrationTests : CleanDatabaseTests() {

    @Autowired
    lateinit var testRestTemplate: TestRestTemplate

    @BeforeEach
    fun beforeEach(info: TestInfo) {
        val isAuthorized = info.displayName.contains("TRUE")
        if (isAuthorized) {
            authorize()
            testRestTemplate.getForEntity<String>("/")
        } else {
            clear()
        }
    }

    fun assertSecureWithSuccess(isAuthorized: IsAuthorized,
                                responseEntity: ResponseEntity<String>,
                                schemaName: String?) {

        when (isAuthorized) {
            IsAuthorized.TRUE -> {
                Assertions.assertThat(responseEntity.headers.contentType!!.toString())
                        .isEqualTo("application/json")

                if (responseEntity.statusCode != HttpStatus.OK) {
                    Assertions.fail<String>("Expected OK response but got error: ${responseEntity.body}")
                }
                if (schemaName != null) {
                    JSONValidator().validateSuccess(responseEntity.body!!, schemaName)
                }

            }
            IsAuthorized.FALSE -> {
                if (responseEntity.statusCode == HttpStatus.FOUND) {
                    // obtains when request is a POST
                    assertLoginLocation(responseEntity)
                } else {
                    // obtains when request is a GET
                    assertSuccess(responseEntity)
                    Assertions.assertThat(responseEntity.body!!).contains("<title>Login</title>")
                }
            }
        }
    }

    fun assertSecureWithSuccess(isAuthorized: IsAuthorized,
                                responseEntity: ResponseEntity<ByteArray>) {

        when (isAuthorized) {
            IsAuthorized.TRUE -> {
                assertSuccess(responseEntity)
            }
            IsAuthorized.FALSE -> {
                if (responseEntity.statusCode == HttpStatus.FOUND) {
                    // obtains when request is a POST
                    assertLoginLocation(responseEntity)
                } else {
                    // obtains when request is a GET
                    assertSuccess(responseEntity)
                }
            }
        }
    }

    fun <T> assertSuccess(responseEntity: ResponseEntity<T>) {
        Assertions.assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.OK)
    }

    fun <T> assertLoginLocation(responseEntity: ResponseEntity<T>) {
        Assertions.assertThat(responseEntity.headers.location!!.toString()).isEqualTo("/login")
    }

    fun assertSecureWithError(isAuthorized: IsAuthorized,
                              responseEntity: ResponseEntity<String>,
                              httpStatus: HttpStatus,
                              errorCode: String,
                              errorDetail: String? = null) {

        when (isAuthorized) {
            IsAuthorized.TRUE -> {
                Assertions.assertThat(responseEntity.headers.contentType!!.toString()).isEqualTo("application/json")
                Assertions.assertThat(responseEntity.statusCode).isEqualTo(httpStatus)
                JSONValidator().validateError(responseEntity.body!!, errorCode, errorDetail)
            }
            IsAuthorized.FALSE -> {
                Assertions.assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.FOUND)
                Assertions.assertThat(responseEntity.headers.location!!.toString()).isEqualTo("/login")
            }
        }
    }

    enum class IsAuthorized {
        TRUE,
        FALSE
    }

    private fun clear() {
        testRestTemplate.restTemplate.interceptors.clear()
    }

    protected fun authorize() {
        testRestTemplate.restTemplate.interceptors.add(AuthInterceptor(testRestTemplate))
    }

    protected fun getResponseData(entity: ResponseEntity<String>): JsonNode {
        return ObjectMapper().readTree(entity.body)["data"]
    }
}
