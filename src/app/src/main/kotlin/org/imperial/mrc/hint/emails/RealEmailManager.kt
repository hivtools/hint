package org.imperial.mrc.hint.emails

import org.imperial.mrc.hint.AppProperties
import org.simplejavamail.email.Email
import org.simplejavamail.mailer.Mailer
import org.simplejavamail.mailer.config.ServerConfig
import org.simplejavamail.mailer.config.TransportStrategy
import org.slf4j.Logger
import org.slf4j.LoggerFactory

class RealEmailManager(appProperties: AppProperties): EmailManager
{
    private val logger: Logger = LoggerFactory.getLogger(RealEmailManager::class.java)

    val server = appProperties.emailServer
    val port = appProperties.emailPort
    val sender = appProperties.emailSender
    val username = appProperties.emailUsername
    val password = appProperties.emailPassword

    override fun sendEmail(data: EmailData, emailAddress: String)
    {
        val mailer = Mailer(
                ServerConfig(server, port, username, password),
                TransportStrategy.SMTP_TLS
        )
        val email = Email().apply {
            addToRecipients(emailAddress)
            setFromAddress("Montagu notifications", sender)
            subject = data.subject
            text = data.text()
            textHTML = data.html()
        }
        mailer.sendMail(email)
        logger.info("mail sent to: ${email}")

    }
}