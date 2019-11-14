package org.imperial.mrc.hint.emails

import com.github.mustachejava.DefaultMustacheFactory
import org.imperial.mrc.hint.getResource
import java.io.StringWriter

data class EmailData(val subject: String,
                     val text: String,
                     val html: String)

abstract class MustacheEmailTemplate {
    abstract val textTemplate: String
    abstract val htmlTemplate: String
    abstract val subject: String // can be a template like "Welcome to {{appName}}"

    private fun text(values: Map<String, String>) = realizeFileTemplate(textTemplate, values)
    private fun html(values: Map<String, String>) = realizeFileTemplate(htmlTemplate, values)

    fun emailData(values: Map<String, String>): EmailData {
        val realizedSubject = realizeStringTemplate(subject, values)
        return EmailData(realizedSubject, text(values), html(values))
    }

    private fun realizeStringTemplate(template: String, values: Map<String, String>): String {
        return StringWriter().use { output ->
            template.byteInputStream().bufferedReader().use { input ->
                DefaultMustacheFactory()
                        .compile(input, "text")
                        .execute(output, values)
                output.toString()
            }
        }
    }

    private fun realizeFileTemplate(templateFileName: String, values: Map<String, String>): String {
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