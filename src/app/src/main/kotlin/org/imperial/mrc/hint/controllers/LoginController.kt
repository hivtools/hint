package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping
import javax.servlet.http.HttpServletRequest

@Controller
class LoginController(private val appProperties: AppProperties, private val request: HttpServletRequest) {

    @GetMapping("/login")
    fun login(model: Model): String {
        model["title"] = appProperties.applicationTitle
        model["username"] = request.getParameter("username") ?: ""
        model["error"] = if (request.getParameter("error") == null) {
            ""
        } else {
            "Username or password is incorrect"
        }

        return "login"
    }
}