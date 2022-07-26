package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping
import javax.servlet.http.HttpServletRequest
import org.imperial.mrc.hint.AppProperties
// import org.imperial.mrc.hint.exceptions.HintException
// import org.springframework.http.HttpStatus
// import org.imperial.mrc.hint.exceptions.HintExceptionHandler
import java.util.*

fun ResourceBundle.getUTF8String(key: String): String
    {
        return this.getString(key)
                .toByteArray(Charsets.ISO_8859_1)
                .toString(Charsets.UTF_8)
    }

fun getErrorMessageTranslation(key: String, request: HttpServletRequest): String
{
    val language = request.getHeader("Accept-Language") ?: "en"
    val resourceBundle = ResourceBundle.getBundle("ErrorMessageBundle", Locale(language))
    return resourceBundle.getUTF8String(key)
}

@Controller
class LoginController(private val request: HttpServletRequest,
                      private val session: Session,
                      private val appProperties: AppProperties)
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

            // request.getParameter("message") ?: HintException("SessionExpiredLogin", HttpStatus.BAD_REQUEST)
            // request.getParameter("message") ?: HintExceptionHandler.handleHintException(HintException("SessionExpiredLogin", HttpStatus.BAD_REQUEST), request)
            // request.getParameter("message") ?: HintExceptionHandler.translatedError("SessionExpiredLogin", HttpStatus.BAD_REQUEST, request)
            request.getParameter("message") ?: getErrorMessageTranslation("SessionExpiredLogin", request)
        }
        else
        {
            // HintException("badUsernamePassword", HttpStatus.BAD_REQUEST)
            // HintExceptionHandler.handleHintException(HintException("badUsernamePassword", HttpStatus.BAD_REQUEST), request)
            // HintExceptionHandler.translatedError("badUsernamePassword", HttpStatus.BAD_REQUEST, request)
            getErrorMessageTranslation("badUsernamePassword", request)
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
