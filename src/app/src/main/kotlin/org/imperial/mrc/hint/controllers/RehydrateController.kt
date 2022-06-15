package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.security.Session
import org.jetbrains.annotations.NotNull
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import javax.servlet.http.HttpServletRequest
import javax.validation.Valid

@RestController
@RequestMapping("rehydrate")
class RehydrateController(apiClient: HintrAPIClient,
                          fileManager: FileManager,
                          session: Session,
                          versionRepository: VersionRepository,
                          request: HttpServletRequest) :
        HintrController(fileManager, apiClient, session, versionRepository, request)
{
    @PostMapping("/submit")
    fun submitRehydrate(@RequestParam("file") @NotNull @Valid file: MultipartFile): ResponseEntity<String>
    {
        val outputZip = fileManager.saveOutput(file)
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