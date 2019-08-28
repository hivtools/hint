package org.imperial.mrc.hint.emails

import com.github.mustachejava.DefaultMustacheFactory
import org.imperial.mrc.hint.getResource
import java.io.StringWriter

interface EmailData
{
    val subject: String
    fun text(): String
    fun html(): String
}

abstract class MustacheEmail : EmailData
{
    abstract val textTemplate: String
    abstract val htmlTemplate: String
    abstract val values: Map<String, String>

    override final fun text() = realize(textTemplate)
    override final fun html() = realize(htmlTemplate)

    private fun realize(templateFileName: String): String
    {
        return StringWriter().use { output ->
            val templateURI = getResource("email_templates/$templateFileName")
            templateURI.openStream().bufferedReader().use { input ->
                DefaultMustacheFactory()
                        .compile(input, "email")
                        .execute(output, values)
                output.toString()
            }
        }
    }
}