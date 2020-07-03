package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.VersionException
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.Version
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.PostMapping

@RestController
class VersionsController(private val session: Session,
                         private val snapshotRepository: SnapshotRepository,
                         private val versionRepository: VersionRepository)
{
    private val userId = session.getUserProfile().id

    @PostMapping("/version/")
    @ResponseBody
    fun newVersion(@RequestBody request: Map<String, String>): ResponseEntity<String>
    {
        val versionName = request["name"] ?: throw VersionException("Version name missing")
        val versionId = versionRepository.saveNewVersion(userId, versionName)

        //Generate new snapshot id and set it as the session variable, and save new snapshot to db
        val newSnapshotId = session.generateNewSnapshotId()
        snapshotRepository.saveSnapshot(newSnapshotId, versionId)

        val snapshot = snapshotRepository.getSnapshot(newSnapshotId)
        val version = Version(versionId, versionName, listOf(snapshot))

        return SuccessResponse(version).asResponseEntity()
    }

    @PostMapping("version/{name}/snapshot/{id}/state")
    @ResponseBody
    fun uploadState(@PathVariable("name") versionName: String,
                    @PathVariable("id") snapshotId: String,
                    @RequestBody state: String): ResponseEntity<String>
    {
        snapshotRepository.saveSnapshotState(snapshotId, versionName, userId, state)
    }
}

