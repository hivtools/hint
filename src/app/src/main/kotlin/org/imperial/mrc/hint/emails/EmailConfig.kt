package org.imperial.mrc.hint.emails

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class EmailConfig
{
    @Bean
    fun getEmailManager(appProperties: AppProperties, oneTimeTokenManager: OneTimeTokenManager): EmailManager
    {
        val mode = appProperties.emailMode
        return when (mode)
        {
            "real" -> RealEmailManager(appProperties, oneTimeTokenManager)
            "disk" -> WriteToDiskEmailManager(appProperties, oneTimeTokenManager)
            else -> throw Exception("Unknown email mode '$mode'")
        }
    }
}
