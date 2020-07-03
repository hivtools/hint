package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.VersionException
import org.imperial.mrc.hint.models.*
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.PostMapping

@RestController
class VersionsController(private val session: Session,
                         private val snapshotRepository: SnapshotRepository,
                         private val versionRepository: VersionRepository)
{
   @PostMapping("/version/")
    @ResponseBody
    fun newVersion(@RequestBody request: Map<String, String>): ResponseEntity<String>
    {
        val versionName = request["name"] ?: throw VersionException("Version name missing")
        val versionId = versionRepository.saveNewVersion(getUserId(), versionName)

        //Generate new snapshot id and set it as the session variable, and save new snapshot to db
        val newSnapshotId = session.generateNewSnapshotId()
        snapshotRepository.saveSnapshot(newSnapshotId, versionId)

        val snapshot = snapshotRepository.getSnapshot(newSnapshotId)
        val version = Version(versionId, versionName, listOf(snapshot))

        return SuccessResponse(version).asResponseEntity()
    }

   @PostMapping("/version/{versionId}/snapshot/{snapshotId}/state")
    @ResponseBody
    fun uploadState(@PathVariable("versionId") versionId: Int,
                    @PathVariable("snapshotId") snapshotId: String,
                    @RequestBody state: String): ResponseEntity<String>
    {
        snapshotRepository.saveSnapshotState(snapshotId, versionId, getUserId(), state)
        return EmptySuccessResponse.asResponseEntity()
    }

    private fun getUserId(): String
    {
        return session.getUserProfile().id
    }
}

