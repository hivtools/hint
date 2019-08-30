package org.imperial.mrc.hint

import org.springframework.stereotype.Component
import java.io.File
import java.io.FileNotFoundException
import java.net.URL
import java.util.*

interface AppProperties {
    val apiUrl: String
    val applicationTitle: String
    val applicationUrl: String
    val emailMode: String
    val emailServer: String
    val emailPort: Int?
    val emailSender: String
    val emailUsername: String
    val emailPassword: String
    val tokenIssuer: String
    val uploadDirectory: String
    val dbUser: String
    val dbPassword: String
}

//prevent auto-wiring of default Properties
class HintProperties: Properties()

@Component
class ConfiguredAppProperties(private val props: HintProperties = properties): AppProperties {
    override val apiUrl = propString("hintr_url")
    override val applicationTitle = propString("application_title")
    override val applicationUrl = propString("application_url")
    override val emailMode = propString("email_mode")
    override val emailServer = propString("email_server")
    override val emailPort = propString("email_port").toIntOrNull()
    override val emailSender = propString("email_sender")
    override val emailUsername= propString("email_username")
    override val emailPassword= propString("email_password")
    override val tokenIssuer = propString("token_issuer")
    override val uploadDirectory = propString("upload_dir")
    override val dbUser: String = propString("db_user")
    override val dbPassword: String = propString("db_password")

    companion object
    {

        fun readProperties(configPath: String): HintProperties {
            return HintProperties().apply {
                load(getResource("config.properties").openStream())
                val global = File(configPath)
                if (global.exists())
                {
                    global.inputStream().use { load(it) }
                }
            }
        }

        var configPath = "/etc/hint/config.properties"
        val properties = readProperties(configPath)
    }

    private fun propString(propName: String): String
    {
        return props[propName].toString()
    }
}

fun getResource(path: String): URL
{
    val url: URL? = AppProperties::class.java.classLoader.getResource(path)
    if (url != null)
    {
        return url
    }
    else
    {
        throw FileNotFoundException("Unable to load '$path' as a resource steam")
    }
}
