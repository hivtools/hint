package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.VersionFile
import org.imperial.mrc.hint.models.asResponseEntity
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/session")
class SessionController(private val fileManager: FileManager)
{

    @PostMapping("/files/")
    @ResponseBody
    fun postFiles(@RequestBody files: Map<String, VersionFile?>): ResponseEntity<String>
    {
        fileManager.setAllFiles(files)
        return SuccessResponse(files).asResponseEntity()
    }
}
