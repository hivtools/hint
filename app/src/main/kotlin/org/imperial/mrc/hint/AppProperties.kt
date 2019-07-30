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
class ConfiguredAppProperties: AppProperties {

    override val uploadDirectory = properties["upload_dir"].toString()

    companion object
    {
        val properties = Properties().apply {
            load(getResource("config.properties").openStream())
            val global = File("/etc/orderly/web/config.properties")
            if (global.exists())
            {
                global.inputStream().use { load(it) }
            }
        }
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