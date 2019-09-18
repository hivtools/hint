package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MultipartFile

abstract class HintrController(private val fileManager: FileManager,
                               private val apiClient: APIClient) {

    protected fun saveAndValidate(file: MultipartFile, type: FileType): ResponseEntity<String> {
        val path = fileManager.saveFile(file, type)
        return validate(path, type)
    }

    protected fun getAndValidate(type: FileType): ResponseEntity<String> {
        val file = fileManager.getFile(type)
        return if (file != null) {
           validate(file.path, type)
        } else {
            SuccessResponse(null).asResponseEntity()
        }
    }

    private fun validate(path: String, type: FileType): ResponseEntity<String> {
        return when (type)
        {
            FileType.PJNZ, FileType.Population, FileType.Shape -> apiClient.validateBaseline(path, type)
            else -> {
                val shapePath = fileManager.getFile(FileType.Shape)?.path
                        ?: throw HintException("You must upload a shape file before uploading survey or programme data",
                                HttpStatus.BAD_REQUEST)
                apiClient.validateSurveyAndProgramme(path, shapePath, type)}
        }
    }
}
