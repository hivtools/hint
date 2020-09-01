package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/baseline")
class BaselineController(fileManager: FileManager,
                         apiClient: HintrAPIClient,
                         session: Session,
                         versionRepository: VersionRepository) :
        HintrController(fileManager, apiClient, session, versionRepository) {

    @PostMapping("/pjnz/")
    @ResponseBody
    fun uploadPJNZ(@RequestParam("file") file: MultipartFile): ResponseEntity<String> {
        return saveAndValidate(file, FileType.PJNZ)
    }

    @GetMapping("/pjnz/")
    @ResponseBody
    fun getPJNZ(): ResponseEntity<String> {
        return getAndValidate(FileType.PJNZ)
    }

    @DeleteMapping("/pjnz/")
    @ResponseBody
    fun removePJNZ(): ResponseEntity<String> {
        versionRepository.removeVersionFile(session.getVersionId(), FileType.PJNZ)
        return EmptySuccessResponse.asResponseEntity()
    }

    @PostMapping("/shape/")
    @ResponseBody
    fun uploadShape(@RequestParam("file") file: MultipartFile): ResponseEntity<String> {
        return saveAndValidate(file, FileType.Shape)
    }

    @GetMapping("/shape/")
    @ResponseBody
    fun getShape(): ResponseEntity<String> {
        return getAndValidate(FileType.Shape)
    }

    @DeleteMapping("/shape/")
    @ResponseBody
    fun removeShape(): ResponseEntity<String> {
        versionRepository.removeVersionFile(session.getVersionId(), FileType.Shape)
        return EmptySuccessResponse.asResponseEntity()
    }

    @PostMapping("/population/")
    @ResponseBody
    fun uploadPopulation(@RequestParam("file") file: MultipartFile): ResponseEntity<String> {
        return saveAndValidate(file, FileType.Population)
    }

    @GetMapping("/population/")
    @ResponseBody
    fun getPopulation(): ResponseEntity<String> {
        return getAndValidate(FileType.Population)
    }

    @DeleteMapping("/population/")
    @ResponseBody
    fun removePopulation(): ResponseEntity<String> {
        versionRepository.removeVersionFile(session.getVersionId(), FileType.Population)
        return EmptySuccessResponse.asResponseEntity()
    }

    @GetMapping("/validate/")
    @ResponseBody
    fun validate(): ResponseEntity<String> {
        return apiClient.validateBaselineCombined(
                listOf(FileType.PJNZ, FileType.Shape, FileType.Population)
                        .map { it.toString() to fileManager.getFile(it) }.toMap()
        )
    }

}
