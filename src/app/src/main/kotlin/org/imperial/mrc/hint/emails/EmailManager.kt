package org.imperial.mrc.hint.emails

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager

interface EmailManager {
    fun sendEmail(data: EmailData, emailAddress: String)
    fun sendPasswordEmail(emailAddress: String, username: String, emailTemplate: PasswordEmailTemplate)
}

abstract class BaseEmailManager(private val appProperties: AppProperties,
                                private val oneTimeTokenManager: OneTimeTokenManager) : EmailManager {

    override fun sendPasswordEmail(emailAddress: String, username: String, emailTemplate: PasswordEmailTemplate) {
        val token = oneTimeTokenManager.generateOnetimeSetPasswordToken(username)

        val values = mapOf(
                "appTitle" to appProperties.applicationTitle,
                "appUrl" to appProperties.applicationUrl,
                "token" to token,
                "email" to emailAddress
        )

        val data = emailTemplate.emailData(values)
        this.sendEmail(data, emailAddress)
    }
}
