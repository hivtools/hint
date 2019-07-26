package org.imperial.mrc.modelserver.controllers

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping
import javax.servlet.http.HttpServletRequest

@Controller
class LoginController(@Autowired val request: HttpServletRequest) {

    @GetMapping("/login")
    fun login(model: Model): String {
        model["title"] = "Login"
        model["username"] = request.getParameter("username") ?: ""
        model["error"] = if (request.getParameter("error") == null) {
            ""
        } else {
            "Username or password is incorrect"
        }

        return "login"
    }
}