package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/download")
class DownloadController(val apiClient: APIClient){
    @GetMapping("/spectrum/{id}/")
    @ResponseBody
    fun getSpectrum(@PathVariable("id")id: String): ResponseEntity<ByteArray> {
        return apiClient.downloadSpectrum(id);
    }

    @GetMapping("/summary/{id}/")
    @ResponseBody
    fun getSummary(@PathVariable("id")id: String): ResponseEntity<ByteArray> {
        return apiClient.downloadSummary(id);
    }
}