package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/disease")
class DiseaseController(fileManager: FileManager,
                        apiClient: APIClient,
                        session: Session,
                        sessionRepository: SessionRepository) :
        HintrController(fileManager, apiClient, session, sessionRepository) {

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

    @DeleteMapping("/survey/")
    @ResponseBody
    fun removeSurvey(): ResponseEntity<String> {
        sessionRepository.removeSessionFile(session.getSnapshotId(), FileType.Survey)
        return EmptySuccessResponse.asResponseEntity()
    }

    @DeleteMapping("/programme/")
    @ResponseBody
    fun removeProgramme(): ResponseEntity<String> {
        sessionRepository.removeSessionFile(session.getSnapshotId(), FileType.Programme)
        return EmptySuccessResponse.asResponseEntity()
    }

    @DeleteMapping("/anc/")
    @ResponseBody
    fun removeANC(): ResponseEntity<String> {
        sessionRepository.removeSessionFile(session.getSnapshotId(), FileType.ANC)
        return EmptySuccessResponse.asResponseEntity()
    }

}
