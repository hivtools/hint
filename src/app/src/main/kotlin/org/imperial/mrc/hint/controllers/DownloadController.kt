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
@RequestMapping("/download")
class DownloadController(apiClient: HintrAPIClient,
                         fileManager: FileManager,
                         session: Session,
                         versionRepository: VersionRepository,
                         request: HttpServletRequest) :
        HintrController(fileManager, apiClient, session, versionRepository, request)
{
    @GetMapping("/submit/{type}/{id}")
    @ResponseBody
    fun getDownloadOutput(@PathVariable("type") type: String,
                  @PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.downloadOutputSubmit(type, id)
    }

    @PostMapping("/rehydrate/submit")
    fun submitRehydrate(@RequestParam("file") @NotNull @Valid file: MultipartFile): ResponseEntity<String>
    {
        val outputZip = fileManager.saveOutput(file)
        return apiClient.submitRehydrate(outputZip)
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
