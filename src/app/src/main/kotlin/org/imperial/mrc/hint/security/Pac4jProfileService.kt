package org.imperial.mrc.hint.security

import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy
import javax.sql.DataSource

@Configuration
open class Pac4jProfileService(@Autowired val dataSource: DataSource)
{
    @Bean
    open fun profileService(): DbProfileService
    {
        return DbProfileService(TransactionAwareDataSourceProxy(dataSource), SecurePasswordEncoder())
    }
}
