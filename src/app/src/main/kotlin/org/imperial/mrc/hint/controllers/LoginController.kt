package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping
import javax.servlet.http.HttpServletRequest
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.oauth2.OAuth2AuthenticationRedirection
import org.imperial.mrc.hint.security.oauth2.OAuth2State

@Controller
class LoginController(
    private val request: HttpServletRequest,
    private val session: Session,
    appProperties: AppProperties,
    oauth2State: OAuth2State
) : OAuth2AuthenticationRedirection(appProperties, oauth2State)
{
    @GetMapping("/login")
    fun login(model: Model): Any
    {
        if (appProperties.oauth2LoginMethod)
        {
            return oauth2LoginRedirect()
        }

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
        model["appTitle"] = if (redirectTo == "explore")
        {
            appProperties.exploreApplicationTitle
        }
        else
        {
            appProperties.applicationTitle
        }
        model["continueTo"] = redirectTo ?: "/"
        session.setRequestedUrl(redirectTo)

        return "login"
    }
}
