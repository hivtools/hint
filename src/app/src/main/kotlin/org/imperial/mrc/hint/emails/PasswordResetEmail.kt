package org.imperial.mrc.hint.emails

sealed class PasswordEmail : MustacheEmail()

class PasswordResetEmail
    : PasswordEmail() {

    override val subject = "Password change for {{appTitle}}"
    override val textTemplate = "password-reset.txt"
    override val htmlTemplate = "password-reset.html"
}


class AccountCreationEmail : PasswordEmail() {

    override val subject = "Account creation for {{appTitle}}"
    override val textTemplate = "account-creation.txt"
    override val htmlTemplate = "account-creation.html"
}
