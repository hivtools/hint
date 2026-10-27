package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
class GuestVersionController(private val session: Session,
                             private val versionRepository: VersionRepository)
{
    // A guest has no project, so no owner to check. Each guest tab asks for its own version here, and the server
    // remembers which versions it gave to this session.
    @PostMapping("/guest/version")
    @ResponseBody
    fun newGuestVersion(): ResponseEntity<String>
    {
        if (!session.userIsGuest())
        {
            throw HintException("guestsOnly", HttpStatus.FORBIDDEN)
        }
        val versionId = session.generateVersionId()
        versionRepository.saveVersion(versionId, null)
        session.addGuestVersionId(versionId)
        return SuccessResponse(versionRepository.getVersion(versionId)).asResponseEntity()
    }
}
