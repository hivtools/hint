package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/baseline")
class BaselineController(fileManager: FileManager,
                         session: Session,
                         sessionRepository: SessionRepository,
                         apiClient: APIClient) : HintrController(fileManager, session, sessionRepository, apiClient) {

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

}
