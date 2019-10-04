package org.imperial.mrc.hint

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.httpGet
import com.github.kittinunf.fuel.httpPost
import org.imperial.mrc.hint.models.ModelRunParameters
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

interface APIClient {
    fun validateBaselineIndividual(path: String, type: FileType): ResponseEntity<String>
    fun validateSurveyAndProgramme(path: String, shapePath: String, type: FileType): ResponseEntity<String>
    fun submit(data: Map<String, String>, parameters: ModelRunParameters): ResponseEntity<String>
    fun getStatus(id: String): ResponseEntity<String>
    fun getResult(id: String): ResponseEntity<String>
    fun getPlottingMetadata(country: String): ResponseEntity<String>
}

@Component
class HintrAPIClient(
        appProperties: AppProperties,
        private val objectMapper: ObjectMapper) : APIClient {

    private val baseUrl = appProperties.apiUrl

    override fun validateBaselineIndividual(path: String, type: FileType): ResponseEntity<String> {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "path" to path))

        return "$baseUrl/validate/baseline-individual"
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

    override fun submit(data: Map<String, String>, parameters: ModelRunParameters): ResponseEntity<String> {

        val json = objectMapper.writeValueAsString(
                mapOf("parameters" to parameters,
                        "data" to data))

        return "$baseUrl/model/submit"
                .httpPost()
                .header("Content-Type" to "application/json")
                .body(json)
                .response()
                .second
                .asResponseEntity()
    }

    override fun getStatus(id: String): ResponseEntity<String> {
        return "$baseUrl/model/status/${id}"
                .httpGet()
                .response()
                .second
                .asResponseEntity()
    }

    override fun getResult(id: String): ResponseEntity<String> {
        return "$baseUrl/model/result/${id}"
                .httpGet()
                .response()
                .second
                .asResponseEntity()
    }

    override fun getPlottingMetadata(country: String): ResponseEntity<String> {
        return "$baseUrl/meta/plotting/${country}"
                .httpGet()
                .response()
                .second
                .asResponseEntity()
    }
}
