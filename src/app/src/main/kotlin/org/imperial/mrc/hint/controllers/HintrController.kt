package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.models.toJsonString
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MultipartFile

abstract class HintrController(private val fileManager: FileManager,
                               private val apiClient: APIClient) {

    protected fun saveAndValidate(file: MultipartFile, type: FileType): ResponseEntity<String> {
        val path = fileManager.saveFile(file, type)
        return apiClient.validate(path, type)
    }

    protected fun getIfExists(type: FileType): ResponseEntity<String> {
        val file = fileManager.getFile(FileType.Shape)
        return if (file != null) {
            apiClient.validate(file.path, FileType.Shape)
        } else {
            SuccessResponse(null).asResponseEntity()
        }
    }
}
