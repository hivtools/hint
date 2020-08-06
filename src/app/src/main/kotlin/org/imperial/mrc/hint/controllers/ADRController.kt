package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/adr")
class ADRController(private val session: Session,
                    private val encryption: Encryption,
                    private val userRepository: UserRepository,
                    private val adrClientBuilder: ADRClientBuilder,
                    private val objectMapper: ObjectMapper,
                    private val appProperties: AppProperties) {

    @GetMapping("/key")
    fun getAPIKey(): ResponseEntity<String> {
        val userId = session.getUserProfile().id
        val encryptedKey = userRepository.getADRKey(userId)
        val key = if (encryptedKey != null) {
            encryption.decrypt(encryptedKey)
        } else {
            null
        }
        return SuccessResponse(key).asResponseEntity()
    }

    @PostMapping("/key")
    fun saveAPIKey(@RequestParam("key") key: String): ResponseEntity<String> {
        val userId = session.getUserProfile().id
        val encryptedKey = encryption.encrypt(key)
        userRepository.saveADRKey(userId, encryptedKey)
        return SuccessResponse(key).asResponseEntity()
    }

    @DeleteMapping("/key")
    fun deleteAPIKey(): ResponseEntity<String> {
        val userId = session.getUserProfile().id
        userRepository.deleteADRKey(userId)
        return SuccessResponse(null).asResponseEntity()
    }

    @GetMapping("/datasets")
    fun getDatasets(@RequestParam showInaccessible: Boolean = false): ResponseEntity<String> {
        val adr = adrClientBuilder.build()
        var url = "package_search?q=type:${appProperties.adrSchema}"
        url = if (showInaccessible) {
            // this flag is used for testing but will never
            // actually be passed by the front-end
            url
        } else {
            "$url&hide_inaccessible_resources=true"
        }
        val response = adr.get(url)
        return if (response.statusCode != HttpStatus.OK) {
            response
        } else {
            val data = objectMapper.readTree(response.body!!)["data"]["results"]
            SuccessResponse(data.filter { it["resources"].count() > 0 }).asResponseEntity()
        }
    }
}
