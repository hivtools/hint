package org.imperial.mrc.hint.controllers

import java.util.*
import javax.servlet.http.HttpServletRequest

open class Controllers(val request: HttpServletRequest)
{
    protected fun translateMessage(key: String): String
    {
        val language = request.getHeader("Accept-Language") ?: "en"
        val resourceBundle = ResourceBundle.getBundle("ErrorMessageBundle", Locale(language))
        return resourceBundle.getString(key)
    }
}
