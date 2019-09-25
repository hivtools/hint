package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MultipartFile

abstract class HintrController(private val fileManager: FileManager,
                               private val session: Session,
                               private val sessionRepository: SessionRepository,
                               private val apiClient: APIClient) {

    protected fun saveAndValidate(file: MultipartFile, type: FileType): ResponseEntity<String> {
        val path = fileManager.saveFile(file, type)
        return validate(file.originalFilename!!, path, type)
    }

    protected fun getAndValidate(type: FileType): ResponseEntity<String> {
        val file = sessionRepository.getSessionFile(session.getId(), type)
        return if (file != null) {
            val path = fileManager.getPath(file)
            validate(file.originalFilename, path, type)
        } else {
            SuccessResponse(null).asResponseEntity()
        }
    }

    private fun validate(originalFilename: String, path: String, type: FileType): ResponseEntity<String> {
        return when (type) {
            FileType.PJNZ, FileType.Population, FileType.Shape ->
                apiClient.validateBaselineIndividual(originalFilename, path, type)
            else -> {
                val file = sessionRepository.getSessionFile(session.getId(), FileType.Shape)
                        ?: throw HintException("You must upload a shape file before uploading survey or programme data",
                                HttpStatus.BAD_REQUEST)
                val shapePath = fileManager.getPath(file)
                apiClient.validateSurveyAndProgramme(originalFilename, path, shapePath, type)
            }
        }
    }
}
