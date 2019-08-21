package org.imperial.mrc.hint.helpers

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.junit.jupiter.api.Assertions
import org.leadpony.justify.api.JsonSchema
import org.leadpony.justify.api.JsonValidationService
import org.leadpony.justify.api.Problem
import org.leadpony.justify.api.ProblemHandler
import java.net.URL

class JSONValidator {

    private val service = JsonValidationService.newInstance()
    private val responseSchema = getSchema("Response")
    private val objectMapper = ObjectMapper()

    private fun getSchema(name: String): JsonSchema {
        val url = URL("https://raw.githubusercontent.com/mrc-ide/hintr/master/inst/schema/$name.json")
        return url.openStream().use {
            service.readSchema(it)
        }
    }

    fun validate(response: String, schemaName: String) {
        val problems = mutableListOf<Problem>()
        val handler = ProblemHandler.collectingTo(problems)
        service.createParser(response.byteInputStream(), responseSchema, handler)

        if (problems.any()) {
            Assertions.fail<Any>("JSON failed schema validation. Attempted to validate: $response against $schemaName.")
        }

        val data = objectMapper.readValue<JsonNode>(response)["data"]
        val dataSchema = getSchema(schemaName)
        service.createParser(objectMapper.writeValueAsString(data).byteInputStream(), dataSchema, handler)

    }

}