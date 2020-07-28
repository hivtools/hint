package org.imperial.mrc.hint

import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Component

@Component
class ADRClientBuilder(val appProperties: AppProperties,
                       val encryption: Encryption,
                       val session: Session,
                       val userRepository: UserRepository) {

    fun build(): ADRClient {

        val userId = this.session.getUserProfile().id
        val encryptedKey = this.userRepository.getADRKey(userId)?: throw UserException("noADRKey")
        val apiKey = this.encryption.decrypt(encryptedKey)
        return ADRClient(this.appProperties, apiKey)
    }
}

class ADRClient(appProperties: AppProperties,
                private val apiKey: String) : FuelClient(appProperties.adrUrl) {

    override fun standardHeaders(): Map<String, Any> {
        return mapOf("Authorization" to apiKey)
    }
}
