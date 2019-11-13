package org.imperial.mrc.hint.emails

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.simplejavamail.email.Email
import org.simplejavamail.mailer.Mailer
import org.simplejavamail.mailer.config.ServerConfig
import org.simplejavamail.mailer.config.TransportStrategy
import org.slf4j.Logger
import org.slf4j.LoggerFactory

class RealEmailManager(appProperties: AppProperties,
                       oneTimeTokenManager: OneTimeTokenManager,
                       val logger: Logger = LoggerFactory.getLogger(RealEmailManager::class.java),
                       val mailer: Mailer = Mailer(
                               ServerConfig(appProperties.emailServer,
                                       appProperties.emailPort,
                                       appProperties.emailUsername,
                                       appProperties.emailPassword),
                               TransportStrategy.SMTP_TLS)): BaseEmailManager(appProperties, oneTimeTokenManager)
{
    val sender = appProperties.emailSender
    val appTitle = appProperties.applicationTitle

    override fun sendEmail(data: EmailData, emailAddress: String)
    {
        val email = Email().apply {
            addToRecipients(emailAddress)
            setFromAddress("${appTitle} notifications", sender)
            subject = data.subject
            text = data.text()
            textHTML = data.html()
        }
        mailer.sendMail(email)
        logger.info("mail sent to: ${emailAddress}")

    }
}