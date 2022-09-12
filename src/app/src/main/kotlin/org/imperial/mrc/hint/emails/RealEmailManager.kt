package org.imperial.mrc.hint.emails

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.logging.GenericLogger
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.simplejavamail.api.mailer.Mailer
import org.simplejavamail.api.mailer.config.TransportStrategy
import org.simplejavamail.email.EmailBuilder
import org.simplejavamail.mailer.MailerBuilder
import org.slf4j.LoggerFactory

class RealEmailManager(
    appProperties: AppProperties,
    oneTimeTokenManager: OneTimeTokenManager,
    private val logger: GenericLogger,
    val mailer: Mailer = MailerBuilder
        .withSMTPServer(
            appProperties.emailServer,
            appProperties.emailPort,
            appProperties.emailUsername,
            appProperties.emailPassword
        )
        .withTransportStrategy(TransportStrategy.SMTP_TLS)
        .buildMailer(),
) : BaseEmailManager(appProperties, oneTimeTokenManager)
{
    val sender = appProperties.emailSender
    val appTitle = appProperties.applicationTitle

    override fun sendEmail(data: EmailData, emailAddress: String)
    {
        val email = EmailBuilder.startingBlank()
            .from("$appTitle notifications", sender)
            .to(emailAddress)
            .withSubject(data.subject)
            .withPlainText(data.text)
            .withHTMLText(data.html)
            .buildEmail()

        mailer.sendMail(email)
        logger.info("mail sent to: $emailAddress")
    }
}
