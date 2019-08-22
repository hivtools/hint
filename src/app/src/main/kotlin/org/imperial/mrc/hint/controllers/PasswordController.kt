package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.*
import org.imperial.mrc.hint.db.UserRepository

@Controller
@RequestMapping("/password")
class PasswordController(private val userRepository: UserRepository,
                         private val onetimeTokenGenerator: OneTimeTokenManager) {
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

            //TODO: send email

            return token
        }

        return ""
    }
}
