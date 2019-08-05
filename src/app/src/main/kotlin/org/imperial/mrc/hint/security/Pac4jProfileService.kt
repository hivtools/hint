package org.imperial.mrc.hint.security

import org.pac4j.core.credentials.password.JBCryptPasswordEncoder
import org.pac4j.sql.profile.service.DbProfileService
import javax.sql.DataSource
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy


@Configuration
open class Pac4jProfileService(@Autowired val dataSource: DataSource)
{
    companion object {
        val salt = "\$2a\$10\$whERBRv1HHJJ5/BEjtKYme"
    }

    @Bean
    open fun profileService(): DbProfileService
    {
        //TODO: Use Libsodium
        return DbProfileService(TransactionAwareDataSourceProxy(dataSource), JBCryptPasswordEncoder(salt))
    }

}
