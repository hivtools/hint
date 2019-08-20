package org.imperial.mrc.hint.controllers

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody

@Controller
@RequestMapping("/password")
class PasswordController {
    @GetMapping("/forgot-password")
    fun forgotPassword(): String {
        return "forgot-password"
    }

    @PostMapping("/request-reset-link")
    @ResponseBody
    fun requestResetLink(): String
    {
        //TODO: implement this!
        return ""
    }
}
