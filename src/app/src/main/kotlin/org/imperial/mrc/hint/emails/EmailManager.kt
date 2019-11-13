package org.imperial.mrc.hint.emails

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager

interface EmailManager {
    fun sendEmail(data: EmailData, emailAddress: String)
    fun sendPasswordResetEmail(email: String, username: String, firstTime: Boolean)
}

abstract class BaseEmailManager(private val appProperties: AppProperties,
                                private val oneTimeTokenManager: OneTimeTokenManager) : EmailManager {

    override fun sendPasswordResetEmail(email: String, username: String, firstTime: Boolean) {
        val token = oneTimeTokenManager.generateOnetimeSetPasswordToken(username)

        val emailMessage = PasswordResetEmail(appProperties.applicationTitle,
                appProperties.applicationUrl,
                token,
                email,
                firstTime)

        this.sendEmail(emailMessage, email)
    }
}
