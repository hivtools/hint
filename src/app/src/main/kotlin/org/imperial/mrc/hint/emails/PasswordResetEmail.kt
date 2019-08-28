package org.imperial.mrc.hint.emails

class PasswordResetEmail(applicationTitle: String,
                         applicationUrl: String,
                         token: String,
                         recipientEmail: String) : MustacheEmail()
{
    override val subject = "Password change for ${applicationTitle}"
    override val textTemplate = "password-reset.txt"
    override val htmlTemplate = "password-reset.html"

    override val values = mapOf(
            "appTitle" to applicationTitle,
            "appUrl" to applicationUrl,
            "token" to token,
            "email" to recipientEmail
    )
}