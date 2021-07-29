package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.io.FileNotFoundException
import java.net.URL
import javax.xml.ws.Response

@RestController
@RequestMapping("/meta")
class MetadataController(val apiClient: HintrAPIClient,
                         private val classLoader: ClassLoader = MetadataController::class.java.classLoader)
{
    @GetMapping("/plotting/{iso3}")
    @ResponseBody
    fun plotting(@PathVariable("iso3") iso3: String): ResponseEntity<String>
    {
        return apiClient.getPlottingMetadata(iso3)
    }

    @GetMapping("/hintr/version")
    @ResponseBody
    fun version(): ResponseEntity<String>
    {
        return apiClient.getVersion()
    }

    @GetMapping("/generic-chart")
    @ResponseBody
    fun genericChart(): ResponseEntity<String>
    {
        // Reading config from local resources is temporary, and will be replaced by fetch from hintr in
        // https://mrc-ide.myjetbrains.com/youtrack/issue/mrc-2536
        val metadata = readFromResource("metadata/generic-chart.json")
        val timeSeriesConfig = readFromResource("metadata/input-time-series-config-jsonata.txt")
        val fullMetadata = metadata.replace("<INPUT_TIME_SERIES_CONFIG_JSONATA>", timeSeriesConfig)
        return  SuccessResponse(fullMetadata).asResponseEntity()
    }

    private fun readFromResource(path: String): String {
        val url: URL? = classLoader.getResource(path)
        return url?.readText() ?: throw FileNotFoundException("Resource file '$path' not found")
    }
}
