package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.*
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.emails.PasswordResetEmail
import org.imperial.mrc.hint.exceptions.HintException
import org.springframework.ui.Model
import org.springframework.ui.set
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.imperial.mrc.hint.models.toJsonString
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import javax.validation.constraints.Size

class TokenException(message: String): HintException(message, HttpStatus.BAD_REQUEST)

@Controller
@Validated
@RequestMapping("/password")
class PasswordController(private val userRepository: UserRepository,
                         private val oneTimeTokenManager: OneTimeTokenManager,
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
            val token = oneTimeTokenManager.generateOnetimeSetPasswordToken(user)

            val emailMessage = PasswordResetEmail(appProperties.applicationTitle,
                    appProperties.applicationUrl,
                    token,
                    email)

            emailManager.sendEmail(emailMessage, email)
        }

        return EmptySuccessResponse.toJsonString()
    }

    @GetMapping("/reset-password")
    fun getResetPassword(@RequestParam("token") token: String, model: Model): String {
        model["token"] = token
        return "reset-password"
    }

    @PostMapping("/reset-password")
    @ResponseBody
    @Throws(TokenException::class)
    fun postResetPassword(@RequestParam("token") token: String,
                         @RequestParam("password") @Size(min = 6, message="Password must be at least 6 characters long")
                                        password: String): String
    {
        val user = oneTimeTokenManager.validateToken(token) ?: throw TokenException("Token is not valid")

        userRepository.updateUserPassword(user, password)
        return EmptySuccessResponse.toJsonString()
    }
}


