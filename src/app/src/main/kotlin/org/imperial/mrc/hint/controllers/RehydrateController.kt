package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("rehydrate")
class RehydrateController(val apiClient: HintrAPIClient,
                          val fileManager: FileManager)
{
    @PostMapping("/submit")
    fun submitRehydrate(@RequestParam("file") file: MultipartFile): ResponseEntity<String>
    {
        val outputZip = fileManager.saveOutputZip(file)
        return apiClient.submitRehydrate(outputZip)
    }

    @GetMapping("/status/{id}")
    fun getRehydrateStatus(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.rehydrateStatus(id)
    }

    @GetMapping("/result/{id}")
    fun getRehydrateResult(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.rehydrateResult(id)
    }
}
