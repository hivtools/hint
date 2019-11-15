package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.models.SessionFileWithPath
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MultipartFile

abstract class HintrController(protected val fileManager: FileManager,
                               protected val apiClient: APIClient,
                               protected val session: Session,
                               protected val sessionRepository: SessionRepository) {

    protected fun saveAndValidate(file: MultipartFile, type: FileType): ResponseEntity<String> {
        val sessionFile = fileManager.saveFile(file, type)
        return validate(sessionFile, type)
    }

    protected fun getAndValidate(type: FileType): ResponseEntity<String> {
        val file = fileManager.getFile(type)
        return if (file != null) {
           validate(file, type)
        } else {
            SuccessResponse(null).asResponseEntity()
        }
    }

    private fun validate(file: SessionFileWithPath, type: FileType): ResponseEntity<String> {
        return when (type)
        {
            FileType.PJNZ, FileType.Population, FileType.Shape -> apiClient.validateBaselineIndividual(file, type)
            else -> {
                val shapePath = fileManager.getFile(FileType.Shape)?.path
                        ?: throw HintException("You must upload a shape file before uploading survey or programme data",
                                HttpStatus.BAD_REQUEST)
                apiClient.validateSurveyAndProgramme(file, shapePath, type)}
        }
    }
}
