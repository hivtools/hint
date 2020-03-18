package org.imperial.mrc.hint

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.Fuel.head
import com.github.kittinunf.fuel.httpDownload
import com.github.kittinunf.fuel.httpGet
import com.github.kittinunf.fuel.httpPost
import com.github.kittinunf.fuel.core.Request
import org.imperial.mrc.hint.models.ModelRunOptions
import org.imperial.mrc.hint.models.SessionFileWithPath
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

interface APIClient {
    fun validateBaselineIndividual(file: SessionFileWithPath, type: FileType): ResponseEntity<String>
    fun validateBaselineCombined(files: Map<String, SessionFileWithPath?>): ResponseEntity<String>
    fun validateSurveyAndProgramme(file: SessionFileWithPath, shapePath: String, type: FileType): ResponseEntity<String>
    fun submit(data: Map<String, String>, modelRunOptions: ModelRunOptions): ResponseEntity<String>
    fun getStatus(id: String): ResponseEntity<String>
    fun getResult(id: String): ResponseEntity<String>
    fun getPlottingMetadata(iso3: String): ResponseEntity<String>
    fun downloadSpectrum(id: String): ResponseEntity<StreamingResponseBody>
    fun downloadSummary(id: String): ResponseEntity<StreamingResponseBody>
    fun getModelRunOptions(files: Map<String, SessionFileWithPath>): ResponseEntity<String>
    fun cancelModelRun(id: String): ResponseEntity<String>
}

@Component
class HintrAPIClient(
        appProperties: AppProperties,
        private val objectMapper: ObjectMapper) : APIClient {

    private val baseUrl = appProperties.apiUrl

    fun getAcceptLanguage(): String {
        val requestAttributes = RequestContextHolder.getRequestAttributes()
        if (requestAttributes is ServletRequestAttributes) {
            return requestAttributes.request.getHeader("Accept-Language")?: "en"
        }
        return "en"
    }

    override fun validateBaselineIndividual(file: SessionFileWithPath,
                                            type: FileType): ResponseEntity<String> {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "file" to file))

        return postJson("validate/baseline-individual", json)
    }

    override fun validateSurveyAndProgramme(file: SessionFileWithPath,
                                            shapePath: String,
                                            type: FileType): ResponseEntity<String> {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "file" to file,
                        "shape" to shapePath))

        return postJson("validate/survey-and-programme", json)
    }

    override fun submit(data: Map<String, String>, modelRunOptions: ModelRunOptions): ResponseEntity<String> {

        val json = objectMapper.writeValueAsString(
                mapOf("options" to modelRunOptions.options,
                        "version" to modelRunOptions.version,
                        "data" to data))

        return postJson("model/submit", json)
    }

    override fun getStatus(id: String): ResponseEntity<String> {
        return get("model/status/${id}")
    }

    override fun getResult(id: String): ResponseEntity<String> {
        return get("model/result/${id}")
    }

    override fun getPlottingMetadata(iso3: String): ResponseEntity<String> {
        return get("meta/plotting/${iso3}")
    }

    override fun getModelRunOptions(files: Map<String, SessionFileWithPath>): ResponseEntity<String> {
        val json = objectMapper.writeValueAsString(files)
        return postJson("model/options", json)
    }

    override fun validateBaselineCombined(files: Map<String, SessionFileWithPath?>): ResponseEntity<String> {
        val json = objectMapper.writeValueAsString(
                files.mapValues { it.value?.path }
        )
        return postJson("validate/baseline-combined", json)
    }

    override fun cancelModelRun(id: String): ResponseEntity<String> {
        return "$baseUrl/model/cancel/${id}".httpPost()
                .addTimeouts()
                .response()
                .second
                .asResponseEntity()
    }

    fun get(url: String): ResponseEntity<String> {
        return "$baseUrl/$url".httpGet()
                .header("Accept-Language" to getAcceptLanguage())
                .addTimeouts()
                .response()
                .second
                .asResponseEntity()
    }

    private fun postJson(url: String, json: String): ResponseEntity<String> {
        return "$baseUrl/$url".httpPost()
                .addTimeouts()
                .header("Accept-Language" to getAcceptLanguage())
                .header("Content-Type" to "application/json")
                .body(json)
                .response()
                .second
                .asResponseEntity()
    }

    private fun Request.addTimeouts(): Request {
        return this.timeout(60000)
                .timeoutRead(60000)
    }

    override fun downloadSpectrum(id: String): ResponseEntity<StreamingResponseBody> {
        return "$baseUrl/download/spectrum/${id}"
                .httpDownload()
                .getStreamingResponseEntity(::head)
    }

    override fun downloadSummary(id: String): ResponseEntity<StreamingResponseBody> {
        return "$baseUrl/download/summary/${id}"
                .httpDownload()
                .getStreamingResponseEntity(::head)
    }

}
