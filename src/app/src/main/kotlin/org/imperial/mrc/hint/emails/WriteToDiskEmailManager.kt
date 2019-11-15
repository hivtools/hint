package org.imperial.mrc.hint.emails

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.io.File
import java.time.Instant

class WriteToDiskEmailManager(appProperties: AppProperties,
                              oneTimeTokenManager: OneTimeTokenManager)
    : BaseEmailManager(appProperties, oneTimeTokenManager) {
    override fun sendEmail(data: EmailData, emailAddress: String) {
        val text = data.text
        outputDirectory.mkdirs()
        val file = File(outputDirectory, Instant.now().toString())
        file.writeText(text)
        logger.info("Wrote email to ${file.absolutePath}")
    }

    companion object {
        private val logger: Logger = LoggerFactory.getLogger(WriteToDiskEmailManager::class.java)
        val outputDirectory = File("/tmp/hint_emails")

        fun cleanOutputDirectory() {
            outputDirectory.mkdirs()
            outputDirectory.listFiles().forEach {
                it.delete()
            }
        }
    }
}