package org.imperial.mrc.hint

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.core.Response
import com.github.kittinunf.fuel.httpPost
import org.springframework.context.annotation.Configuration

interface APIClient {
    fun validate(path: String, type: FileType): Response
}

@Configuration
open class HintAPIClient(
        appProperties: AppProperties,
        private val objectMapper: ObjectMapper) : APIClient {

    private val baseUrl = appProperties.apiUrl

    override fun validate(path: String, type: FileType): Response {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "path" to path))

        return "$baseUrl/validate"
                .httpPost()
                .header("Content-Type" to "application/json")
                .body(json)
                .response()
                .second
    }

}