package org.imperial.mrc.hint.emails

import org.imperial.mrc.hint.AppProperties
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

interface EmailManager
{
    fun sendEmail(data: EmailData, emailAddress: String)
}

@Configuration
open class EmailManagerConfig {
    @Bean
    open fun getEmailManager(@Autowired appProperties: AppProperties): EmailManager {
        val mode = appProperties.emailMode
        return when (mode) {
            //"real" -> RealEmailManager()
            "disk" -> WriteToDiskEmailManager()
            else -> throw Exception("Unknown email mode '$mode'")
        }
    }
}