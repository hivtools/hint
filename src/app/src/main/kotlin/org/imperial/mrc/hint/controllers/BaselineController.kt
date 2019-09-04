package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.toJsonString
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/baseline")
class BaselineController(private val fileManager: FileManager,
                         apiClient: APIClient) : HintrController(fileManager, apiClient) {

    @PostMapping("/pjnz/")
    @ResponseBody
    fun uploadPJNZ(@RequestParam("file") file: MultipartFile): String {

        val fileName = file.originalFilename!!
        fileManager.saveFile(file, FileType.PJNZ)

        // TODO request validation from R API and get back JSON
        // for now just read country name from file
        val countryName = fileName.split("_").first()
        return SuccessResponse(buildPjnzResponse(fileName, countryName)).toJsonString()
    }

    @GetMapping("/pjnz/")
    @ResponseBody
    fun getPJNZ(): String {

        // TODO request serialised data for this id from the R API
        // for now just read basic file info from upload dir
        val file = fileManager.getFile(FileType.PJNZ)

        val pjnzResponse = if (file != null) {
            val fileName = file.name
            val countryName = fileName.split("_").first()
            buildPjnzResponse(fileName, countryName)
        } else {
            null
        }

        return SuccessResponse(pjnzResponse).toJsonString()
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

    private fun buildPjnzResponse(fileName: String, countryName: String): Map<String, Any> {
        return mapOf("filename" to fileName, "data" to mapOf("country" to countryName), "type" to "pjnz")
    }

}
