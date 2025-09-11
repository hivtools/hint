package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.HintrApiResponse
import org.imperial.mrc.hint.clients.asHintrSuccessResponse
import org.imperial.mrc.hint.models.AdrResource
import org.imperial.mrc.hint.service.ADRService
import org.imperial.mrc.hint.service.ProjectService
import org.imperial.mrc.hint.service.RehydratedProject
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("rehydrate")
class RehydrateController(val projectService: ProjectService,
                          val adrService: ADRService)
{
    @PostMapping("/zip")
    fun submitRehydrate(@RequestParam("file") file: MultipartFile): ResponseEntity<HintrApiResponse<RehydratedProject>>
    {
        val result = projectService.rehydrateProject(file.inputStream)
        return ResponseEntity.ok(asHintrSuccessResponse(result))
    }

    @PostMapping("/adr")
    fun submitAdrRehydrate(@RequestBody data: AdrResource): ResponseEntity<HintrApiResponse<RehydratedProject>>
    {
        val adrFileBytes = adrService.getFileBytes(data)
        val result = projectService.rehydrateProject(adrFileBytes)
        return ResponseEntity.ok(asHintrSuccessResponse(result))
    }
}
