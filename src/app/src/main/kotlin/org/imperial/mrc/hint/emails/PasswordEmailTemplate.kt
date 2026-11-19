package org.imperial.mrc.hint.emails

sealed class PasswordEmailTemplate : MustacheEmailTemplate()
{
    class ResetPassword
        : PasswordEmailTemplate()
    {

        override val subject = "Password change for {{appTitle}}"
        override val textTemplate = "password-reset.txt"
        override val htmlTemplate = "password-reset.html"
    }
}

