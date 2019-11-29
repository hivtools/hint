package org.imperial.mrc.hint.unit.templates

import com.gargoylesoftware.htmlunit.StringWebResponse
import com.gargoylesoftware.htmlunit.WebClient
import com.gargoylesoftware.htmlunit.html.HTMLParser
import com.gargoylesoftware.htmlunit.html.HtmlPage
import freemarker.template.Configuration
import freemarker.template.Template
import freemarker.template.TemplateExceptionHandler
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.xmlmatchers.transform.XmlConverters.the
import java.io.File
import java.io.StringWriter
import java.io.Writer
import java.net.URL
import javax.xml.transform.Source
import java.util.*

class FreemarkerTemplateLoader(val templateName: String, val templatePath: String = "static/templates")
{
    companion object
    {
        const val anyUrl = "http://localhost"

        fun getWebClient(): WebClient
        {
            val client = WebClient()
            client.isThrowExceptionOnFailingStatusCode = false
            client.isThrowExceptionOnScriptError = false
            return client
        }

        val anyWindow = getWebClient().currentWindow

    }

    private var template: Template? = null


    private fun getTemplate() : Template
    {
        return template ?: loadTemplate()
    }

    private fun loadTemplate(): Template
    {
        val config = configureTemplateLoader()
        template = config.getTemplate(templateName)
        return template!!
    }

    private fun configureTemplateLoader(): Configuration
    {
        val config = buildFreemarkerConfig(File(templatePath))
        config.templateExceptionHandler = TemplateExceptionHandler.RETHROW_HANDLER

        return config
    }

    private fun webResponseFor(dataModel: Any): StringWebResponse
    {
        return StringWebResponse(stringResponseFor(dataModel), URL(anyUrl))
    }

    fun writerResponseFor(dataModel: Any): Writer
    {
        val writer = StringWriter()
        getTemplate().process(dataModel, writer)
        return writer
    }

    fun stringResponseFor(dataModel: Any): String
    {
        return writerResponseFor(dataModel).toString()
    }

    fun htmlPageResponseFor(dataModel: Any): HtmlPage
    {
        return HTMLParser.parse(webResponseFor(dataModel), anyWindow)
    }

    fun xmlResponseFor(dataModel: Any): Source
    {
        return the(htmlPageResponseFor(dataModel).asXml())
    }

    fun jsoupDocFor(dataModel: Any): Document
    {
        val stringResponse = stringResponseFor(dataModel)
        return Jsoup.parse(stringResponse)
    }

    private fun buildFreemarkerConfig(templateDirectory: File): Configuration
    {
        val freeMarkerConfig = Configuration(Configuration.VERSION_2_3_26)
        freeMarkerConfig.defaultEncoding = "UTF-8"
        freeMarkerConfig.locale = Locale.UK
        freeMarkerConfig.setDirectoryForTemplateLoading(templateDirectory)

        return freeMarkerConfig
    }
}
