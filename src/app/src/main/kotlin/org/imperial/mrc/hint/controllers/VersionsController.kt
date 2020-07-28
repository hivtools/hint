package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.db.VersionRepository
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
    @PostMapping("/version/")
    @ResponseBody
    fun newVersion(@RequestParam("name") name: String): ResponseEntity<String>
    {
        val versionId = versionRepository.saveNewVersion(userId(), name)

        //Generate new snapshot id and set it as the session variable, and save new snapshot to db
        val newSnapshotId = session.generateNewSnapshotId()
        snapshotRepository.saveSnapshot(newSnapshotId, versionId)

        val snapshot = snapshotRepository.getSnapshot(newSnapshotId)
        val version = Version(versionId, name, listOf(snapshot))

        return SuccessResponse(version).asResponseEntity()
    }

    @GetMapping("/versions/")
    @ResponseBody
    fun getVersions(): ResponseEntity<String>
    {
        val versions =
                if (session.userIsGuest()) {
                    listOf<Version>()
                } else {
                    versionRepository.getVersions(userId())
                }
        return SuccessResponse(versions).asResponseEntity()
    }

    private fun userId(): String
    {
        return session.getUserProfile().id
    }
}
