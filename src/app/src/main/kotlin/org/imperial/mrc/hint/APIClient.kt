package org.imperial.mrc.hint

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.httpPost
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

interface APIClient {
    fun validate(path: String, type: FileType): ResponseEntity<String>
}

@Component
class HintAPIClient(
        appProperties: AppProperties,
        private val objectMapper: ObjectMapper) : APIClient {

    private val baseUrl = appProperties.apiUrl

    override fun validate(path: String, type: FileType): ResponseEntity<String> {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "path" to "/uploads/$path"))

        return "$baseUrl/validate/input"
                .httpPost()
                .header("Content-Type" to "application/json")
                .body(json)
                .response()
                .second
                .asResponseEntity()
    }

}