package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.emails.PasswordEmailTemplate
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.EmptySuccessResponse
import org.imperial.mrc.hint.models.toJsonString
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

class TokenException(key: String) : HintException(key, HttpStatus.BAD_REQUEST)

@Controller
@Validated
@RequestMapping("/password")
class PasswordController(private val appProperties: AppProperties,
                         private val userLogic: UserLogic,
                         private val oneTimeTokenManager: OneTimeTokenManager,
                         private val emailManager: EmailManager) {

    companion object {
        private const val MIN_PASSWORD_LENGTH = 6
    }

    @GetMapping("/forgot-password")
    fun forgotPassword(model: Model): String {
        model["title"] = appProperties.applicationTitle
        return "forgot-password"
    }

    @PostMapping("/request-reset-link")
    @ResponseBody
    fun requestResetLink(@RequestParam("email") email: String): String {
        val user = userLogic.getUser(email)

        if (user != null) {
            emailManager.sendPasswordEmail(email, user.username, PasswordEmailTemplate.ResetPassword())
        }

        return EmptySuccessResponse.toJsonString()
    }

    @GetMapping("/reset-password")
    fun getResetPassword(@RequestParam("token") token: String, model: Model): String {
        model["title"] = appProperties.applicationTitle
        model["token"] = token
        return "reset-password"
    }

    @PostMapping("/reset-password")
    @ResponseBody
    @Throws(TokenException::class)
    fun postResetPassword(@RequestParam("token") token: String,
                          @RequestParam("password")
                          password: String): String {
        if (password.length < MIN_PASSWORD_LENGTH) {
            throw HintException("invalidPasswordLength", HttpStatus.BAD_REQUEST)
        }

        val user = oneTimeTokenManager.validateToken(token) ?: throw TokenException("invalidToken")
        userLogic.updateUserPassword(user, password)
        return EmptySuccessResponse.toJsonString()
    }
}
