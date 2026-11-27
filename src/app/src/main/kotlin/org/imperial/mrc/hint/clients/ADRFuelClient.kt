package org.imperial.mrc.hint.clients

import org.imperial.mrc.hint.*
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.logADRRequestDuration
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import java.io.File
import java.io.InputStream
import java.net.http.HttpResponse

@Component
class ADRClientBuilder(val appProperties: AppProperties,
                       val encryption: Encryption,
                       val session: Session,
                       val userRepository: UserRepository,
                       val logger: GenericLogger)
{

    fun build(): ADRClient
    {
        val userId = this.session.getUserProfile().id
        val encryptedKey = this.userRepository.getADRKey(userId) ?: throw UserException("noADRKey")
        val apiKey = this.encryption.decrypt(encryptedKey)
        return ADRFuelClient(this.appProperties.adrUrl, apiKey, this.logger, this.appProperties.adrWafBypassSecret)
    }

    fun buildSSO(): ADRClient
    {
        val token = this.session.getAccessToken()

        if (token.isEmpty())
        {
            logger.info("There was a problem retrieving access token from Auth0")
        }

        return ADRFuelClient(
            this.appProperties.oauth2ClientAdrServerUrl,
            "Bearer $token",
            this.logger,
            this.appProperties.adrWafBypassSecret
        )
    }
}

interface ADRClient
{
    fun getInputStream(url: String): HttpResponse<InputStream>
    fun get(url: String): ResponseEntity<String>
    fun post(url: String, params: List<Pair<String, String>>): ResponseEntity<String>
    fun postFile(url: String, parameters: List<Pair<String, Any?>>, file: Pair<String, File>): ResponseEntity<String>
}

class ADRFuelClient(baseUrl: String,
                    private val apiKey: String,
                    private val logger: GenericLogger,
                    private val wafBypassSecret: String? = null)
    : FuelClient(baseUrl + "api/3/action"), ADRClient
{
    companion object
    {
        const val WAF_BYPASS_HEADER = "X-Naomi-CI"
    }

    override fun get(url: String): ResponseEntity<String>
    {
        return logADRRequestDuration({ super.get(url) }, logger)
    }

    override fun postFile(
        url: String,
        parameters: List<Pair<String, Any?>>,
        file: Pair<String, File>,
    ): ResponseEntity<String>
    {
        return logADRRequestDuration({ super.postFile(url, parameters, file) }, logger)
    }

    override fun postJson(urlPath: String?, json: String): ResponseEntity<String>
    {
        return logADRRequestDuration({ super.postJson(urlPath, json) }, logger)
    }

    override fun standardHeaders(): Map<String, Any>
    {
        val headers = mutableMapOf<String, Any>("Authorization" to apiKey)
        if (wafBypassSecret != null)
        {
            headers[WAF_BYPASS_HEADER] = wafBypassSecret
        }
        return headers
    }

    override fun getInputStream(url: String): HttpResponse<InputStream>
    {
        return logADRRequestDuration({ getStream(getUri(url)) }, logger)
    }
}
