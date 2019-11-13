package org.imperial.mrc.hint.emails

import com.github.mustachejava.DefaultMustacheFactory
import org.imperial.mrc.hint.getResource
import java.io.StringWriter

data class EmailData(val subject: String,
                     val text: String,
                     val html: String)

abstract class MustacheEmail {
    abstract val textTemplate: String
    abstract val htmlTemplate: String
    abstract val subject: String // can be a template like "Welcome to {{appName}}"

    private fun text(values: Map<String, String>) = realize(textTemplate, values)
    private fun html(values: Map<String, String>) = realize(htmlTemplate, values)

    fun emailData(values: Map<String, String>): EmailData {
        val realizedSubject = realizeSimpleString(subject, values)
        return EmailData(realizedSubject, text(values), html(values))
    }

    private fun realizeSimpleString(template: String, values: Map<String, String>): String {
        return StringWriter().use { output ->
            template.byteInputStream().bufferedReader().use { input ->
                DefaultMustacheFactory()
                        .compile(input, "text")
                        .execute(output, values)
                output.toString()
            }
        }
    }

    private fun realize(templateFileName: String, values: Map<String, String>): String {
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