package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.HintrAPIClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

@RestController
@RequestMapping("/download")
class DownloadController(val apiClient: HintrAPIClient){
    @GetMapping("/spectrum/{id}")
    @ResponseBody
    fun getSpectrum(@PathVariable("id")id: String): ResponseEntity<StreamingResponseBody> {
        return apiClient.downloadSpectrum(id)
    }

    @GetMapping("/summary/{id}")
    @ResponseBody
    fun getSummary(@PathVariable("id")id: String): ResponseEntity<StreamingResponseBody> {
        return apiClient.downloadSummary(id)
    }
}