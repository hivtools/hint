package org.imperial.mrc.hint.clients

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import java.io.BufferedInputStream
import java.net.URL
import java.net.URLConnection

@Component
class ADRClientBuilder(val appProperties: AppProperties,
                       val encryption: Encryption,
                       val session: Session,
                       val userRepository: UserRepository) {

    fun build(): ADRClient {
        val userId = this.session.getUserProfile().id
        val encryptedKey = this.userRepository.getADRKey(userId) ?: throw UserException("noADRKey")
        val apiKey = this.encryption.decrypt(encryptedKey)
        return ADRFuelClient(this.appProperties, apiKey)
    }
}

interface ADRClient {
    fun getInputStream(url: String): BufferedInputStream
    fun get(url: String): ResponseEntity<String>
}

class ADRFuelClient(appProperties: AppProperties,
                    private val apiKey: String) : FuelClient(appProperties.adrUrl), ADRClient {

    override fun standardHeaders(): Map<String, Any> {
        return mapOf("Authorization" to apiKey)
    }

    override fun getInputStream(url: String): BufferedInputStream {
        val urlConn: URLConnection = URL(url).openConnection()
        urlConn.setRequestProperty("Authorization", apiKey)
        return BufferedInputStream(urlConn.getInputStream())
    }
}
