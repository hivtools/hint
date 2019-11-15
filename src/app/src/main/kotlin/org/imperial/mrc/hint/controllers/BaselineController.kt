package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/baseline")
class BaselineController(fileManager: FileManager,
                         apiClient: APIClient,
                         session: Session,
                         sessionRepository: SessionRepository) :
        HintrController(fileManager, apiClient, session, sessionRepository) {

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

    @DeleteMapping("/pjnz/{hash}/")
    @ResponseBody
    fun removePJNZ(@PathVariable hash: String): ResponseEntity<String> {
        sessionRepository.removeSessionFile(session.getId(), FileType.PJNZ, hash)
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

    @DeleteMapping("/shape/{hash}/")
    @ResponseBody
    fun removeShape(@PathVariable hash: String): ResponseEntity<String> {
        sessionRepository.removeSessionFile(session.getId(), FileType.Shape, hash)
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

    @DeleteMapping("/population/{hash}/")
    @ResponseBody
    fun removePopulation(@PathVariable hash: String): ResponseEntity<String> {
        sessionRepository.removeSessionFile(session.getId(), FileType.Population, hash)
        return EmptySuccessResponse.asResponseEntity()
    }

    @GetMapping("/validate/")
    @ResponseBody
    fun validate(): ResponseEntity<String> {
        return apiClient.validateBaselineCombined(
                listOf(FileType.PJNZ, FileType.Shape, FileType.Population)
                        .map{ it.toString() to fileManager.getFile(it)}.toMap()
        )
    }

}
