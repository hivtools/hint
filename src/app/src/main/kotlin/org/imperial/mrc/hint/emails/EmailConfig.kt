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
class EmailConfig {
    @Bean
    fun getEmailManager(@Autowired appProperties: AppProperties): EmailManager {
        val mode = appProperties.emailMode
        return when (mode) {
            "real" -> RealEmailManager(appProperties)
            "disk" -> WriteToDiskEmailManager()
            else -> throw Exception("Unknown email mode '$mode'")
        }
    }
}