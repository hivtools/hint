package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.treeToValue
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.helpers.AuthInterceptor
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.helpers.getTestEntity
import org.imperial.mrc.hint.models.ModelRunOptions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInfo
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*

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

    protected fun getModelRunEntity(isAuthorized: IsAuthorized): HttpEntity<String> {
        val version = if (isAuthorized == IsAuthorized.TRUE) {
            uploadMinimalFiles()
            val optionsResponseEntity = testRestTemplate.getForEntity<String>("/model/options/")
            val versionJson = parser.readTree(optionsResponseEntity.body!!)["version"]
            parser.treeToValue<Map<String, String>>(versionJson)
        } else {
            mapOf()
        }
        val modelRunOptions = ModelRunOptions(emptyMap(), version)
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(modelRunOptions)
        return HttpEntity(jsonString, headers)
    }

    protected val parser = ObjectMapper()

    protected fun uploadMinimalFiles() {
        testRestTemplate.postForEntity<String>("/baseline/shape/",
                getTestEntity("malawi.geojson"))

        testRestTemplate.postForEntity<String>("/disease/survey/",
                getTestEntity("survey.csv"))
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
                assertUnauthorized(responseEntity)
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
                assertUnauthorized(responseEntity)
            }
        }
    }

    fun assertSuccess(responseEntity: ResponseEntity<String>,
                      schemaName: String?) {

        Assertions.assertThat(responseEntity.headers.contentType!!.toString())
                .isEqualTo("application/json")

        if (responseEntity.statusCode != HttpStatus.OK) {
            Assertions.fail<String>("Expected OK response but got error: ${responseEntity.body}")
        }
        if (schemaName != null) {
            JSONValidator().validateSuccess(responseEntity.body!!, schemaName)
        }
    }

    fun <T> assertUnauthorized(responseEntity: ResponseEntity<T>) {
        Assertions.assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
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
                              errorDetail: String? = null,
                              errorTrace: String? = null) {

        when (isAuthorized) {
            IsAuthorized.TRUE -> {
                Assertions.assertThat(responseEntity.headers.contentType!!.toString()).isEqualTo("application/json")
                Assertions.assertThat(responseEntity.statusCode).isEqualTo(httpStatus)
                JSONValidator().validateError(responseEntity.body!!, errorCode, errorDetail, errorTrace)
            }
            IsAuthorized.FALSE -> {
                assertUnauthorized(responseEntity)
            }
        }
    }

    fun assertError(responseEntity: ResponseEntity<String>,
                    httpStatus: HttpStatus,
                    errorCode: String,
                    errorDetail: String? = null,
                    errorTrace: String? = null) {

        Assertions.assertThat(responseEntity.headers.contentType!!.toString()).isEqualTo("application/json")
        Assertions.assertThat(responseEntity.statusCode).isEqualTo(httpStatus)
        JSONValidator().validateError(responseEntity.body!!, errorCode, errorDetail, errorTrace)

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
