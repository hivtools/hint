package org.imperial.mrc.hint.helpers

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions
import org.leadpony.justify.api.JsonSchema
import org.leadpony.justify.api.JsonValidationService
import org.leadpony.justify.api.Problem
import org.leadpony.justify.api.ProblemHandler
import java.io.File
import java.net.URI
import java.net.URL
import javax.json.stream.JsonParsingException
import java.io.InputStreamReader
import java.io.BufferedReader
import java.net.HttpURLConnection


class JSONValidator {

    private val service = JsonValidationService.newInstance()
    private val objectMapper = ObjectMapper()
    private val hintrVersion = File("../config/hintr_version").readLines().first()

    private val readerFactory = service.createSchemaReaderFactoryBuilder()
            .withSchemaResolver(this::resolveSchema)
            .build()

    private val responseSchema = getSchema("Response")

    fun validateError(response: String, expectedErrorCode: String, expectedErrorMessage: String? = null,
                      expectErrorCodeInstructions: Boolean = false) {
        assertValidates(response, responseSchema, "Response")
        val error = objectMapper.readValue<JsonNode>(response)["errors"].first()
        val status = objectMapper.readValue<JsonNode>(response)["status"].textValue()

        assertThat(status).isEqualTo("failure")
        assertThat(error["error"].asText()).isEqualTo(expectedErrorCode)
        if (expectedErrorMessage != null) {
            val actualError = error["detail"].asText()
            if (expectErrorCodeInstructions) {
                assertThat(actualError).startsWith(expectedErrorMessage)
                assertThat(errorMessageRegex.matchEntire(actualError)).isNotNull()
            }
            else {
                assertThat(actualError).isEqualTo(expectedErrorMessage)
            }
        }
    }

    fun validateSuccess(response: String, schemaName: String) {
        assertValidates(response, responseSchema, "Response")
        val data = objectMapper.readValue<JsonNode>(response)["data"]
        val status = objectMapper.readValue<JsonNode>(response)["status"].textValue()

        assertThat(status).isEqualTo("success")
        val dataSchema = getSchema(schemaName)
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

    private fun getSchema(name: String): JsonSchema {
        val path = if (name.endsWith(".schema.json")) {
            name
        } else {
            "$name.schema.json"
        }
        val url = URL("https://raw.githubusercontent.com/mrc-ide/hintr/$hintrVersion/inst/schema/$path")

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

    private fun resolveSchema(id: URI): JsonSchema {
        return getSchema(id.path)
    }
}