package org.imperial.mrc.hint.controllers

import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping
import javax.servlet.http.HttpServletRequest

@Controller
class LoginController(private val request: HttpServletRequest)
{

    @GetMapping("/login")
    fun login(model: Model): String
    {
        model["title"] = "Login"
        model["username"] = request.getParameter("username") ?: ""
        model["error"] = if (request.getParameter("error") == null)
        {
            ""
        }
        else if (request.getParameter("error") == "SessionExpired")
        {

            request.getParameter("message") ?: "Your session expired. Please log in again"
        }
        else
        {
            "Username or password is incorrect"
        }

        return "login"
    }
}
