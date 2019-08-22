package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/baseline")
class BaselineController(private val fileManager: FileManager) {

    @PostMapping("/pjnz/")
    @ResponseBody
    fun upload(@RequestParam("file") file: MultipartFile): String {

        val fileName = file.originalFilename!!
        fileManager.saveFile(file, FileType.PJNZ)

        // TODO request validation from R API and get back JSON
        // for now just read country name from file
        val countryName = fileName.split("_").first()
        return "{\"filename\": \"$fileName\", \"country\": \"$countryName\"}"
    }

    @GetMapping("/")
    @ResponseBody
    fun get(): String {

        // TODO request serialised data for this id from the R API
        // for now just read basic file info from upload dir
        val file = fileManager.getFile(FileType.PJNZ)

        return if (file != null) {
            val fileName = file.name
            val countryName = fileName.split("_").first()
            "{\"pjnz\": { \"filename\": \"$fileName\", \"country\": \"$countryName\"}}"
        } else {
            "{\"pjnz\": null}"
        }

    }

}
