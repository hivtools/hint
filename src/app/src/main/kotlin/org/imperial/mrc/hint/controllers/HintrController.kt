package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MultipartFile
import javax.servlet.http.HttpServletRequest

open class HintrController(protected val fileManager: FileManager,
                           protected val apiClient: HintrAPIClient,
                           protected val session: Session,
                           protected val versionRepository: VersionRepository,
                           protected val request: HttpServletRequest)
{

    protected fun saveAndValidate(file: MultipartFile, type: FileType): ResponseEntity<String>
    {
        val strict = request.getParameter("strict") != "false"
        val sessionFile = fileManager.saveFile(file, type)
        return validate(sessionFile, type, strict)
    }

    protected fun saveAndValidate(url: String, type: FileType): ResponseEntity<String>
    {
        val strict = request.getParameter("strict") != "false"
        val sessionFile = fileManager.saveFile(url, type)
        return validate(sessionFile, type, strict)
    }

    protected fun getAndValidate(type: FileType): ResponseEntity<String>
    {
        val strict = request.getParameter("strict") != "false"
        val file = fileManager.getFile(type)
        return if (file != null)
        {
            validate(file, type, strict)
        }
        else
        {
            SuccessResponse(null).asResponseEntity()
        }
    }

    private fun validate(file: VersionFileWithPath, type: FileType, strict: Boolean): ResponseEntity<String>
    {
        return when (type)
        {
            FileType.PJNZ, FileType.Population, FileType.Shape ->
                apiClient.validateBaselineIndividual(file, type)
            else ->
            {
                val files = fileManager.getFiles(FileType.PJNZ, FileType.Shape)

                if (files[FileType.PJNZ.toString()]?.path.isNullOrBlank())
                {
                    throw HintException("missingPjnzFile",
                            HttpStatus.BAD_REQUEST)
                }

                if (files[FileType.Shape.toString()]?.path.isNullOrBlank())
                {
                    throw HintException("missingShapeFile",
                            HttpStatus.BAD_REQUEST)
                }

                val pjnzPath = files[FileType.PJNZ.toString()]?.path
                val shapePath = files[FileType.Shape.toString()]?.path

                apiClient.validateSurveyAndProgramme(file, shapePath, type, pjnzPath, strict)
            }
        }
    }
}
