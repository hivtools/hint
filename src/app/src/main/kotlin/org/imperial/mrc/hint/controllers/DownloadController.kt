package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.JsonNode
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

@RestController
@RequestMapping("/download")
class DownloadController(val apiClient: HintrAPIClient)
{
    @PostMapping("/submit/{type}/{id}")
    @ResponseBody
    fun getDownloadOutput(
            @PathVariable("type") type: String,
            @PathVariable("id") id: String,
            @RequestBody state: Map<String, Any?>? = emptyMap()): ResponseEntity<String>
    {
        return apiClient.downloadOutputSubmit(type, id, state)
    }

    @GetMapping("/status/{id}")
    @ResponseBody
    fun getDownloadOutputStatus(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.downloadOutputStatus(id)
    }

    @GetMapping("/result/{id}")
    @ResponseBody
    fun getDownloadOutputResult(@PathVariable("id") id: String): ResponseEntity<StreamingResponseBody>
    {
        return apiClient.downloadOutputResult(id)
    }
}
