package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.PostMapping as PostMapping1

@RestController
class VersionsController(private val session: Session,
                         private val sessionRepository: SessionRepository,
                         private val versionRepository: VersionRepository)
{
    @PostMapping1("/version/")
    @ResponseBody
    fun newVersion(@RequestBody request: Map<String, String>): ResponseEntity<String>
    {
        val versionName = request["name"] ?: "" //TODO: Exception if not populated
        val user = session.getUserProfile()
        val newVersionId = versionRepository.saveNewVersion(user.id, versionName)

        //Generate new snapshot id and set it as the session variable, and save new snapshot to db
        val newSnapshotId = session.generateNewSnapshotId()
        sessionRepository.saveSession(newSnapshotId, user.id)

        return SuccessResponse(newSnapshotId).asResponseEntity()
    }
}
q
