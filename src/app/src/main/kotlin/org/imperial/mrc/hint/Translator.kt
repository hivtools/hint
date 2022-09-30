package org.imperial.mrc.hint

import org.springframework.stereotype.Component
import java.util.*
import javax.servlet.http.HttpServletRequest

interface Translate
{
    fun key(key: String): String
}

@Component
class Translator(val request: HttpServletRequest) : Translate
{
    override fun key(key: String): String
    {
        println(request.getHeader("Accept-Language"))
        val language = request.getHeader("Accept-Language") ?: "en"
        val resourceBundle = ResourceBundle.getBundle("ErrorMessageBundle", Locale(language))
        return resourceBundle.getString(key)
    }
}
