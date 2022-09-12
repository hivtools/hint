package org.imperial.mrc.hint.clients

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import java.io.BufferedInputStream
import java.io.File
import java.net.URL
import java.net.URLConnection
import java.time.Duration
import java.time.Instant

@Component
class ADRClientBuilder(val appProperties: AppProperties,
                       val encryption: Encryption,
                       val session: Session,
                       val userRepository: UserRepository)
{

    fun build(): ADRClient
    {
        val userId = this.session.getUserProfile().id
        val encryptedKey = this.userRepository.getADRKey(userId) ?: throw UserException("noADRKey")
        val apiKey = this.encryption.decrypt(encryptedKey)
        return ADRFuelClient(this.appProperties, apiKey)
    }
}

interface ADRClient
{
    fun getInputStream(url: String): BufferedInputStream
    fun get(url: String): ResponseEntity<String>
    fun post(url: String, params: List<Pair<String, String>>): ResponseEntity<String>
    fun postFile(url: String, parameters: List<Pair<String, Any?>>, file: Pair<String, File>): ResponseEntity<String>
}

class ADRFuelClient(appProperties: AppProperties,
                    private val apiKey: String,
                    private val logger: GenericLogger = GenericLoggerImpl())
    : FuelClient(appProperties.adrUrl + "api/3/action"), ADRClient
{
    override fun get(url: String): ResponseEntity<String>
    {
        val start = Instant.now()
        val response = super.get(url)
        val end = Instant.now()
        val timeElapsed = Duration.between(start, end).toMillis()
        logger.info("ADR request time elapsed: $timeElapsed")
        return response
    }

    override fun postFile(url: String, parameters: List<Pair<String, Any?>>, file: Pair<String, File>): ResponseEntity<String>
    {
        val start = Instant.now()
        val response = super.postFile(url, parameters, file)
        val end = Instant.now()
        val timeElapsed = Duration.between(start, end).toMillis()
        logger.info("ADR request time elapsed: $timeElapsed")
        return response
    }

    override fun postJson(urlPath: String?, json: String): ResponseEntity<String>
    {
        val start = Instant.now()
        val response = super.postJson(urlPath, json)
        val end = Instant.now()
        val timeElapsed = Duration.between(start, end).toMillis()
        logger.info("ADR request time elapsed: $timeElapsed")
        return response
    }

    override fun standardHeaders(): Map<String, Any>
    {
        return mapOf("Authorization" to apiKey)
    }

    override fun getInputStream(url: String): BufferedInputStream
    {
        val start = Instant.now()
        val urlConn: URLConnection = URL(url).openConnection()
        urlConn.setRequestProperty("Authorization", apiKey)
        val response = BufferedInputStream(urlConn.getInputStream())
        val end = Instant.now()
        val timeElapsed = Duration.between(start, end).toMillis()
        logger.info("ADR request time elapsed: $timeElapsed")
        return response
    }
}
