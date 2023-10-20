package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

@RestController
@RequestMapping("/download")
class DownloadController(val apiClient: HintrAPIClient,
                         protected val fileManager: FileManager)
{
    @PostMapping("/submit/{type}/{id}")
    @ResponseBody
    fun getDownloadOutput(
            @PathVariable("type") type: String,
            @PathVariable("id") id: String,
            @RequestBody projectPayload: Map<String, Any?>? = null): ResponseEntity<String>
    {
        if (type == "agyw") {
            val file = fileManager.getFile(FileType.PJNZ)
            val payload = projectPayload?.toMutableMap() ?: mutableMapOf()
            payload["pjnz"] = file
            return apiClient.downloadOutputSubmit(type, id, payload)
        }
        return apiClient.downloadOutputSubmit(type, id, projectPayload)
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
