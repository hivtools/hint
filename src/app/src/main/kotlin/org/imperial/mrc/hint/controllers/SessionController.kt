package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.models.SessionFile
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.models.toJsonString
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/session")
class SessionController(private val fileManager: FileManager) {

    @PostMapping("/files/")
    @ResponseBody
    fun postFiles(@RequestBody files: Map<String, SessionFile?>): ResponseEntity<String> {
        fileManager.setAllFiles(files)
        return SuccessResponse(files).asResponseEntity()
    }
}