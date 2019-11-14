package org.imperial.mrc.hint.emails

sealed class PasswordEmailTemplate : MustacheEmailTemplate()

class PasswordResetEmailTemplate
    : PasswordEmailTemplate() {

    override val subject = "Password change for {{appTitle}}"
    override val textTemplate = "password-reset.txt"
    override val htmlTemplate = "password-reset.html"
}


class AccountCreationEmailTemplate : PasswordEmailTemplate() {

    override val subject = "Account creation for {{appTitle}}"
    override val textTemplate = "account-creation.txt"
    override val htmlTemplate = "account-creation.html"
}
