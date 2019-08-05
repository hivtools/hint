package org.imperial.mrc.hint

import org.springframework.context.annotation.Configuration
import java.io.File
import java.io.FileNotFoundException
import java.net.URL
import java.util.*

interface AppProperties {
    val uploadDirectory: String
}

@Configuration
open class ConfiguredAppProperties: AppProperties {

    override val uploadDirectory = properties["upload_dir"].toString()

    companion object
    {
        fun readProperties(configPath: String): Properties {
            return Properties().apply {
                load(getResource("config.properties").openStream())
                val global = File(configPath)
                if (global.exists())
                {
                    global.inputStream().use { load(it) }
                }
            }
        }
        val configPath = "/etc/hint/config.properties"
        val properties = readProperties(configPath)
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
