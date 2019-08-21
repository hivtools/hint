package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.security.OneTimeTokenGenerator
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.*
import org.imperial.mrc.hint.db.UserRepository

@Controller
@RequestMapping("/password")
class PasswordController(private val userRepository: UserRepository,
                         private val onetimeTokenGenerator: OneTimeTokenGenerator) {
    @GetMapping("/forgot-password")
    fun forgotPassword(): String {
        return "forgot-password"
    }

    @PostMapping("/request-reset-link")
    @ResponseBody
    fun requestResetLink(@RequestParam("email") email: String): String
    {
        val user = userRepository.getUser(email)

        //TODO: implement this!

        if (user != null)
        {
            val token = onetimeTokenGenerator.getSetPasswordToken(user);

            return token
        }

        return ""
    }
}
