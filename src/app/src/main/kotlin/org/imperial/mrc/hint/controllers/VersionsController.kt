package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.PostMapping as PostMapping1

@RestController
class VersionsController(private val session: Session,
                         private val sessionRepository: SessionRepository)
{
    @PostMapping1("/version/")
    @ResponseBody
    fun newVersion(): ResponseEntity<String>
    {
        session.renew()
        val id = session.getId()
        val user = session.getUserProfile()

        sessionRepository.saveSession(id, user.id)

        return SuccessResponse(id).asResponseEntity()

    }
}
