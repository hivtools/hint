package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.ModelRunOptions
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.PostMapping as PostMapping1

@RestController
class VersionsController(private val session: Session,
                         private val sessionRepository: SessionRepository)
{
    @PostMapping1("/version/")
    @ResponseBody
    fun newVersion(@RequestBody request: Map<String, String>): ResponseEntity<String>
    {
        val versionName = request["name"] ?: "" //TODO: Exception if not populated
        println("CREATING VERSION WITH NAME " + versionName)

        val newSnapshotId = session.generateNewSnapshotId()

        val user = session.getUserProfile()

        sessionRepository.saveSession(newSnapshotId, user.id)

        return SuccessResponse(newSnapshotId).asResponseEntity()
    }
}
