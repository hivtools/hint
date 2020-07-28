package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/adr")
class ADRController(private val session: Session,
                    private val encyption: Encryption,
                    private val userRepository: UserRepository) {

    @PostMapping("/key")
    fun saveAPIKey(@RequestParam("key") key: String): ResponseEntity<String> {
        val userId = session.getUserProfile().id
        val encryptedKey = encyption.encrypt(key)
        userRepository.saveADRKey(userId, encryptedKey)
        return SuccessResponse(null).asResponseEntity()
    }

    @DeleteMapping("/key")
    fun deleteAPIKey(): ResponseEntity<String> {
        val userId = session.getUserProfile().id
        userRepository.deleteADRKey(userId)
        return SuccessResponse(null).asResponseEntity()
    }
}
