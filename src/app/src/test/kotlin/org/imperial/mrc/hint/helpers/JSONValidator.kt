package org.imperial.mrc.hint.helpers

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions
import org.leadpony.justify.api.*
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import javax.json.stream.JsonParsingException


class JSONValidator {

    private val service = JsonValidationService.newInstance()
    private val objectMapper = ObjectMapper()
    private val hintrVersion = File("../config/hintr_version").readLines().first()

    private val hintrSchemaRoot = "https://raw.githubusercontent.com/mrc-ide/hintr/$hintrVersion/inst/schema/"
    private val hintrReaderFactory = service.createSchemaReaderFactoryBuilder()
            .withSchemaResolver(this::resolveHintrSchema)
            .build()

    private val pkgAPISchemaRoot = "https://raw.githubusercontent.com/reside-ic/pkgapi/master/inst/schema/"
    private val pkgAPIReaderFactory = service.createSchemaReaderFactoryBuilder()
            .withSchemaResolver(this::resolvePkgAPISchema)
            .build()

    private val successResponseSchema = getPkgAPISchema("response-success.schema.json")
    private val failureResponseSchema = getPkgAPISchema("response-failure.schema.json")

    fun validateError(response: String,
                      expectedErrorCode: String,
                      expectedErrorMessage: String? = null,
                      errorTrace: String? = null) {
        assertValidates(response, failureResponseSchema, "response-failure")
        val error = objectMapper.readValue<JsonNode>(response)["errors"].first()
        val status = objectMapper.readValue<JsonNode>(response)["status"].textValue()

        assertThat(status).isEqualTo("failure")
        assertThat(error["error"].asText()).isEqualTo(expectedErrorCode)
        if (expectedErrorMessage != null) {
            val actualErrorDetail = error["detail"].asText()
            val regex = Regex(expectedErrorMessage)
            assertThat(regex.matchEntire(actualErrorDetail))
                    .withFailMessage("Expected $actualErrorDetail to match $expectedErrorMessage")
                    .isNotNull()
        }
        if (errorTrace != null) {
            val actualErrorTrace = error["trace"].first().asText()
            val regex = Regex(errorTrace)
            assertThat(regex.matchEntire(actualErrorTrace))
                    .withFailMessage("Expected $actualErrorTrace to match $errorTrace")
                    .isNotNull()
        }
    }

    fun validateSuccess(response: String, schemaName: String) {
        assertValidates(response, successResponseSchema, "response-success")
        val data = objectMapper.readValue<JsonNode>(response)["data"]
        val status = objectMapper.readValue<JsonNode>(response)["status"].textValue()

        assertThat(status).isEqualTo("success")
        val dataSchema = getHintrSchema(schemaName)
        assertValidates(objectMapper.writeValueAsString(data), dataSchema, schemaName)
    }

    private fun assertValidates(jsonString: String, schema: JsonSchema, schemaName: String) {
        val problems = mutableListOf<Problem>()
        val handler = ProblemHandler.collectingTo(problems)
        val parser = service.createParser(jsonString.byteInputStream(), schema, handler)
        while (parser.hasNext()) {
            parser.next()
        }
        if (problems.any()) {
            Assertions.fail<Any>(
                    "JSON failed schema validation. Attempted to validate: $jsonString against $schemaName. " +
                            "Problems were ${problems.joinToString(",")}"
            )
        }
    }

    private fun getSchema(name: String, readerFactory: JsonSchemaReaderFactory, baseUrl: String): JsonSchema {
        val path = if (name.endsWith(".schema.json")) {
            name
        } else {
            "$name.schema.json"
        }
        val url = URL("$baseUrl$path")

        val conn = url.openConnection() as HttpURLConnection
        return BufferedReader(InputStreamReader(conn.getInputStream())).use {
            val reader = readerFactory.createSchemaReader(it)
            try {
                reader.read()
            } catch (e: JsonParsingException) {
                Assertions.fail<JsonSchema>("Could not parse schema $name")
            }
        }
    }

    private fun getPkgAPISchema(name: String): JsonSchema {
        return getSchema(name, pkgAPIReaderFactory, pkgAPISchemaRoot)
    }


    private fun getHintrSchema(name: String): JsonSchema {
        return getSchema(name, hintrReaderFactory, hintrSchemaRoot)
    }

    private fun resolveHintrSchema(id: URI): JsonSchema {
        return getHintrSchema(id.path)
    }

    private fun resolvePkgAPISchema(id: URI): JsonSchema {
        return getPkgAPISchema(id.path)
    }
}
