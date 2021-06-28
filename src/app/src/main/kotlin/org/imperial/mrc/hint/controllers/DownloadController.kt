package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

@RestController
@RequestMapping("/download")
class DownloadController(val apiClient: HintrAPIClient)
{
    @GetMapping("/spectrum/{id}")
    @ResponseBody
    fun getSpectrum(@PathVariable("id") id: String): ResponseEntity<StreamingResponseBody>
    {
        return apiClient.downloadSpectrum(id)
    }

    @GetMapping("/coarse-output/{id}")
    @ResponseBody
    fun getCoarseOutput(@PathVariable("id") id: String): ResponseEntity<StreamingResponseBody>
    {
        return apiClient.downloadCoarseOutput(id)
    }

    @GetMapping("/summary/{id}")
    @ResponseBody
    fun getSummary(@PathVariable("id") id: String): ResponseEntity<StreamingResponseBody>
    {
        return apiClient.downloadSummary(id)
    }

    @GetMapping("/submit/{type}/{id}")
    @ResponseBody
    fun getSubmit(@PathVariable("type") type: String,
                  @PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getDownloadSubmit(id, type)
    }

    @GetMapping("/submit/status/{id}")
    @ResponseBody
    fun getSubmitStatus(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getDownloadSubmitStatus(id)
    }

    @GetMapping("/submit/result/{id}")
    @ResponseBody
    fun getSubmitResult(@PathVariable("id") id: String): ResponseEntity<StreamingResponseBody>
    {
        return apiClient.getDownloadSubmitResult(id)
    }
}
