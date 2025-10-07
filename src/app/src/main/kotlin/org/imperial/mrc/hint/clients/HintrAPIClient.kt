package org.imperial.mrc.hint.clients

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.Fuel.head
import com.github.kittinunf.fuel.httpDownload
import org.imperial.mrc.hint.*
import org.imperial.mrc.hint.models.ModelOptions
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.io.ByteArrayInputStream
import java.io.InputStream
import javax.servlet.http.HttpServletResponse

data class HintrApiResponse<T>(
    val status: String = "success",
    val data: T? = null,
    val errors: List<Any>? = null
)

fun <T> asHintrSuccessResponse(data: T): HintrApiResponse<T> {
    return HintrApiResponse(
        status = "success",
        data = data,
        errors = null,
    )
}

interface HintrAPIClient
{
    fun validateBaselineIndividual(file: VersionFileWithPath, type: FileType): ResponseEntity<String>
    fun validateBaselineCombined(files: Map<String, VersionFileWithPath?>): ResponseEntity<String>
    fun validateSurveyAndProgramme(
        file: VersionFileWithPath,
        shapePath: String?,
        type: FileType,
        strict: Boolean
    ): ResponseEntity<String>

    fun submit(data: Map<String, VersionFileWithPath>, modelRunOptions: ModelOptions): ResponseEntity<String>
    fun getStatus(id: String): ResponseEntity<String>
    fun getResult(id: String): ResponseEntity<String>
    fun getModelRunOptions(files: Map<String, VersionFileWithPath>): ResponseEntity<String>
    fun getModelCalibrationOptions(iso3: String): ResponseEntity<String>
    fun calibrateSubmit(runId: String, calibrationOptions: ModelOptions): ResponseEntity<String>
    fun getCalibrateStatus(id: String): ResponseEntity<String>
    fun getCalibrateResultMetadata(id: String): ResponseEntity<String>
    fun getReviewInputMetadata(iso3: String, files: Map<String, VersionFileWithPath?>): ResponseEntity<String>
    fun getCalibrateResultData(id: String): ResponseEntity<String>
    fun getCalibratePlot(id: String): ResponseEntity<String>
    fun getComparisonPlot(id: String): ResponseEntity<String>
    fun cancelModelRun(id: String): ResponseEntity<String>
    fun getVersion(): ResponseEntity<String>
    fun validateModelOptions(data: Map<String, VersionFileWithPath>, modelRunOptions: ModelOptions):
            ResponseEntity<String>
    fun getInputTimeSeriesChartData(type: String, files: Map<String, VersionFileWithPath>): ResponseEntity<String>
    fun getInputComparisonChartData(files: Map<String, VersionFileWithPath>): ResponseEntity<String>
    fun getInputPopulationMetadata(files: Map<String, VersionFileWithPath>): ResponseEntity<String>
    fun get(url: String): ResponseEntity<String>
    fun getAndForget(url: String)
    fun downloadOutputSubmit(
        type: String,
        id: String,
        projectPayload: Map<String, Any?>? = null
    ): ResponseEntity<String>
    fun downloadOutputStatus(id: String): ResponseEntity<String>
    fun downloadOutputResult(id: String): ResponseEntity<StreamingResponseBody>
    fun getUploadMetadata(id: String): ResponseEntity<String>
    fun wakeUpWorkers()
    fun taskExists(id: String): ResponseEntity<String>
    fun downloadDebug(id: String, response: HttpServletResponse)
}

@Component
class HintrFuelAPIClient(
        appProperties: AppProperties,
        private val objectMapper: ObjectMapper) : HintrAPIClient, FuelClient(appProperties.apiUrl)
{

    private fun getAcceptLanguage(): String
    {
        val requestAttributes = RequestContextHolder.getRequestAttributes()
        if (requestAttributes is ServletRequestAttributes)
        {
            return requestAttributes.request.getHeader("Accept-Language") ?: "en"
        }
        return "en"
    }

    override fun standardHeaders(): Map<String, Any>
    {
        return mapOf("Accept-Language" to getAcceptLanguage())
    }

    override fun httpRequestHeaders(): Array<String>
    {
        return emptyArray()
    }

    override fun validateBaselineIndividual(file: VersionFileWithPath,
                                            type: FileType): ResponseEntity<String>
    {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().lowercase(),
                        "file" to file))

        return postJson("validate/baseline-individual", json)
    }

    override fun validateSurveyAndProgramme(file: VersionFileWithPath,
                                            shapePath: String?,
                                            type: FileType,
                                            strict: Boolean): ResponseEntity<String>
    {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().lowercase(),
                        "file" to file,
                        "shape" to shapePath.orEmpty()))

        return postJson("validate/survey-and-programme?strict=$strict", json)
    }

    override fun submit(data: Map<String, VersionFileWithPath>, modelRunOptions: ModelOptions)
            : ResponseEntity<String>
    {

        val json = objectMapper.writeValueAsString(
                mapOf("options" to modelRunOptions.options,
                      "version" to modelRunOptions.version,
                      "iso3" to modelRunOptions.iso3,
                      "data" to data))

        return postJson("model/submit", json)
    }

    override fun validateModelOptions(data: Map<String, VersionFileWithPath>, modelRunOptions: ModelOptions)
            : ResponseEntity<String>
    {

        val json = objectMapper.writeValueAsString(
                mapOf("options" to modelRunOptions.options,
                      "data" to data))

        return postJson("validate/options", json)
    }

    override fun getStatus(id: String): ResponseEntity<String>
    {
        return get("model/status/${id}")
    }

    override fun getResult(id: String): ResponseEntity<String>
    {
        return get("model/result/${id}")
    }

    override fun calibrateSubmit(runId: String, calibrationOptions: ModelOptions): ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(calibrationOptions)
        return postJson("calibrate/submit/${runId}", json)
    }

    override fun getCalibrateStatus(id: String): ResponseEntity<String>
    {
        return get("calibrate/status/${id}")
    }

    override fun getCalibrateResultMetadata(id: String): ResponseEntity<String>
    {
        return get("calibrate/result/metadata/${id}")
    }

    override fun getReviewInputMetadata(iso3: String, files: Map<String, VersionFileWithPath?>): ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(
                mapOf("data" to files, "iso3" to iso3))
        return postJson("review-input/metadata", json)
    }

    override fun getCalibrateResultData(id: String): ResponseEntity<String>
    {
        return get("calibrate/result/path/${id}")
    }

    override fun getCalibratePlot(id: String): ResponseEntity<String>
    {
        return get("calibrate/plot/${id}")
    }

    override fun getComparisonPlot(id: String): ResponseEntity<String>
    {
        return get("comparison/plot/${id}")
    }

    override fun getModelRunOptions(files: Map<String, VersionFileWithPath>): ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(files)
        return postJson("model/options", json)
    }

    override fun getModelCalibrationOptions(iso3: String): ResponseEntity<String>
    {
        return postEmpty("calibrate/options/${iso3}")
    }

    override fun validateBaselineCombined(files: Map<String, VersionFileWithPath?>): ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(
                files.mapValues { it.value?.path }
        )
        return postJson("validate/baseline-combined", json)
    }

    override fun cancelModelRun(id: String): ResponseEntity<String>
    {
        return postEmpty("model/cancel/${id}")
    }

    override fun getVersion(): ResponseEntity<String>
    {
        return get("hintr/version")
    }

    override fun downloadOutputSubmit(
        type: String,
        id: String,
        projectPayload: Map<String, Any?>?
    ): ResponseEntity<String>
    {
        if (projectPayload.isNullOrEmpty())
        {
            return postEmpty("download/submit/${type}/${id}")
        }

        val json = objectMapper.writeValueAsString(projectPayload)

        return postJson("download/submit/${type}/${id}", json)
    }

    override fun downloadOutputStatus(id: String): ResponseEntity<String>
    {
        return get("download/status/${id}")
    }

    override fun downloadOutputResult(id: String): ResponseEntity<StreamingResponseBody>
    {
        return "$baseUrl/download/result/${id}"
                .httpDownload()
                .getStreamingResponseEntity(::head)
    }

    override fun getUploadMetadata(id: String): ResponseEntity<String>
    {
        return get("meta/adr/${id}")
    }

    override fun getInputTimeSeriesChartData(type: String, files: Map<String, VersionFileWithPath>)
            : ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(
                mapOf("data" to files))

        return postJson("chart-data/input-time-series/$type", json)
    }

    override fun getInputComparisonChartData(files: Map<String, VersionFileWithPath>)
            : ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(files)

        return postJson("chart-data/input-comparison", json)
    }

    override fun getInputPopulationMetadata(files: Map<String, VersionFileWithPath>)
            : ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(files)

        return postJson("chart-data/input-population", json)
    }

    override fun wakeUpWorkers()
    {
        getAndForget("wake")
    }

    override fun taskExists(id: String): ResponseEntity<String>
    {
        return get("task/${id}/exists")
    }

    override fun downloadDebug(id: String, response: HttpServletResponse)
    {
        val returnEmptyInputStream: () -> InputStream = { ByteArrayInputStream(ByteArray(0)) }

        val (_, _, _) = "$baseUrl/model/debug/${id}"
            .httpDownload()
            .streamDestination { fuelResp, _ ->
                // Set headers from the Fuel response
                response.status = fuelResp.statusCode
                fuelResp.headers.forEach { (key, values) ->
                    values.forEach { value -> response.addHeader(key, value) }
                }

                Pair(response.outputStream, returnEmptyInputStream)
            }
            .response()
    }
}
