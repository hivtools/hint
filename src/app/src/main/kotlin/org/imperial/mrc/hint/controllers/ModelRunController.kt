package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.models.ModelRunParameters
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/model")
class ModelRunController(val fileManager: FileManager, val apiClient: APIClient) {

    @PostMapping("/run/")
    @ResponseBody
    fun run(@RequestBody params: ModelRunParameters): ResponseEntity<String> {
        val allFiles = fileManager.getAllFiles()
        return apiClient.submit(allFiles, params)
    }

    @GetMapping("/status/{id}")
    @ResponseBody
    fun status(@PathVariable("id")id: String): ResponseEntity<String> {
        return apiClient.getStatus(id)
    }

    @GetMapping("/result/{id}")
    @ResponseBody
    fun result(@PathVariable("id")id: String): ResponseEntity<String> {
        return apiClient.getResult(id)
    }
}
