package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.asResponseEntity
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/disease")
class DiseaseController(private val fileManager: FileManager,
                        private val apiClient: APIClient) {

    @PostMapping("/survey/")
    @ResponseBody
    fun uploadSurvey(@RequestParam("file") file: MultipartFile): ResponseEntity<String> {

        val path = fileManager.saveFile(file, FileType.Survey)
        val res = apiClient.validate(path, FileType.Survey)
        return res.asResponseEntity()
    }

    @PostMapping("/program/")
    @ResponseBody
    fun uploadProgram(@RequestParam("file") file: MultipartFile): ResponseEntity<String> {

        val path = fileManager.saveFile(file, FileType.Program)
        val res = apiClient.validate(path, FileType.Program)
        return res.asResponseEntity()
    }
}
