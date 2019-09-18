package org.imperial.mrc.hint

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.httpPost
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

interface APIClient {
    fun validateBaseline(path: String, type: FileType): ResponseEntity<String>
    fun validateSurveyAndProgramme(path: String, shapePath: String, type: FileType): ResponseEntity<String>
}

@Component
class HintrAPIClient(
        appProperties: AppProperties,
        private val objectMapper: ObjectMapper) : APIClient {

    private val baseUrl = appProperties.apiUrl

    override fun validateBaseline(path: String, type: FileType): ResponseEntity<String> {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "path" to path))

        return "$baseUrl/validate/input"
                .httpPost()
                .header("Content-Type" to "application/json")
                .body(json)
                .response()
                .second
                .asResponseEntity()
    }

    override fun validateSurveyAndProgramme(path: String, shapePath: String, type: FileType): ResponseEntity<String> {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "path" to path,
                        "shape" to shapePath))

        return "$baseUrl/validate/survey-and-programme"
                .httpPost()
                .header("Content-Type" to "application/json")
                .body(json)
                .response()
                .second
                .asResponseEntity()
    }
}
