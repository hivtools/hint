package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.imperial.mrc.hint.security.oauth2.OAuth2AuthenticationRedirection
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping
import javax.servlet.http.HttpServletRequest

@Controller
class LoginController(
    private val request: HttpServletRequest,
    session: Session,
    appProperties: AppProperties,
) : OAuth2AuthenticationRedirection(appProperties, session)
{
    @GetMapping("/login")
    fun login(model: Model): String
    {
        model["oauth2LoginMethod"] = appProperties.oauth2LoginMethod
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

        val redirectTo = request.getParameter("redirectTo")
        model["appTitle"] = appProperties.applicationTitle
        model["continueTo"] = redirectTo ?: "/"
        session?.setRequestedUrl(redirectTo)

        return "login"
    }

    @GetMapping("/oauth2")
    fun loginRedirection(): ResponseEntity<String>
    {
        return oauth2LoginRedirect()
    }

    @GetMapping("/register")
    fun registerRedirection(): ResponseEntity<String>
    {
        return oauth2RegisterRedirect()
    }

    @GetMapping("/sso")
    fun isSSOLoginMethod(): ResponseEntity<String>
    {
        return SuccessResponse(appProperties.oauth2LoginMethod).asResponseEntity()
    }
}
