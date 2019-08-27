package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.*
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.emails.PasswordResetEmail
import org.springframework.ui.Model
import org.springframework.ui.set

@Controller
@RequestMapping("/password")
class PasswordController(private val userRepository: UserRepository,
                         private val onetimeTokenGenerator: OneTimeTokenManager,
                         private val appProperties: AppProperties,
                         private val emailManager: EmailManager) {

    @GetMapping("/forgot-password")
    fun forgotPassword(): String {
        return "forgot-password"
    }

    @PostMapping("/request-reset-link")
    @ResponseBody
    fun requestResetLink(@RequestParam("email") email: String): String
    {
        val user = userRepository.getUser(email)

        if (user != null)
        {
            val token = onetimeTokenGenerator.generateOnetimeSetPasswordToken(user)

            val emailMessage = PasswordResetEmail(appProperties.applicationTitle,
                    appProperties.applicationUrl,
                    token,
                    email)

            emailManager.sendEmail(emailMessage, email)
        }

        return ""
    }

    @GetMapping("/reset-password")
    fun resetPassword(@RequestParam("token") token: String, model: Model): String {
        model["token"] = token
        return "reset-password"
    }

    @PostMapping("/reset-password")
    @ResponseBody
    fun resetPassword(@RequestParam("token") token: String,
            @RequestParam("password") password: String): String
    {
        //TODO!
        return ""
    }
}


