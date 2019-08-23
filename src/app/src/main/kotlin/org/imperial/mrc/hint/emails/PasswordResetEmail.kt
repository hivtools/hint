package org.imperial.mrc.hint.emails

class PasswordResetEmail(val applicationTitle: String,
                         val applicationUrl: String,
                         val compressedToken: String,
                         val recipientEmail: String) : MustacheEmail()
{
    override val subject = "Password change for ${applicationTitle}"
    override val textTemplate = "password-reset.txt"
    override val htmlTemplate = "password-reset.html"

    override val values = mapOf(
            "appTitle" to applicationTitle,
            "appUrl" to applicationUrl,
            "token" to compressedToken,
            "email" to recipientEmail
    )
}