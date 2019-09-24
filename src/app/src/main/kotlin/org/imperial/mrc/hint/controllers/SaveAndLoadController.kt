package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.db.StateRepository
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
class SaveAndLoadController(val session: Session,
                            val stateRepository: StateRepository) {

    @GetMapping("/save")
    fun save(): ResponseEntity<String> {
        val sessionId = session.getId()
        val timeStamp = Instant.now()

        val hashDict = stateRepository.getFilesForSession(sessionId)
                .associate { it.type to it.hash }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$sessionId-$timeStamp.json\"")
                .body(ObjectMapper().writeValueAsString(hashDict))
    }
}