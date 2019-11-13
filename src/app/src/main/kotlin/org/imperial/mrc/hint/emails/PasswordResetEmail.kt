
package org.imperial.mrc.hint.emails

class PasswordResetEmail(applicationTitle: String,
                         applicationUrl: String,
                         token: String,
                         recipientEmail: String,
                         firstTime: Boolean) : MustacheEmail() {
    override val subject = "Password change for ${applicationTitle}"
    override val textTemplate = if (firstTime) "password-set.txt" else "password-reset.txt"
    override val htmlTemplate = if (firstTime) "password-set.html" else "password-reset.html"

    override val values = mapOf(
            "appTitle" to applicationTitle,
            "appUrl" to applicationUrl,
            "token" to token,
            "email" to recipientEmail
    )
}
