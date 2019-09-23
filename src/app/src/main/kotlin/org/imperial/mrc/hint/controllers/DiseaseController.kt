package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/disease")
class DiseaseController(fileManager: FileManager,
                        apiClient: APIClient): HintrController(fileManager, apiClient) {

    @PostMapping("/survey/")
    @ResponseBody
    fun uploadSurvey(@RequestParam("file") file: MultipartFile): ResponseEntity<String> {
        return saveAndValidate(file, FileType.Survey)
    }

    @PostMapping("/programme/")
    @ResponseBody
    fun uploadProgramme(@RequestParam("file") file: MultipartFile): ResponseEntity<String> {
        return saveAndValidate(file, FileType.Programme)
    }

    @PostMapping("/anc/")
    @ResponseBody
    fun uploadANC(@RequestParam("file") file: MultipartFile): ResponseEntity<String> {
        return saveAndValidate(file, FileType.ANC)
    }

    @GetMapping("/survey/")
    @ResponseBody
    fun getSurvey(): ResponseEntity<String> {
        return getAndValidate(FileType.Survey)
    }

    @GetMapping("/programme/")
    @ResponseBody
    fun getProgramme(): ResponseEntity<String> {
        return getAndValidate(FileType.Programme)
    }

    @GetMapping("/anc/")
    @ResponseBody
    fun getANC(): ResponseEntity<String> {
        return getAndValidate(FileType.ANC)
    }

}
