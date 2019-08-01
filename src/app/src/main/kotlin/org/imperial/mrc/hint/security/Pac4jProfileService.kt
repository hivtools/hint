package org.imperial.mrc.hint.security

import org.pac4j.core.credentials.password.JBCryptPasswordEncoder
import org.pac4j.sql.profile.service.DbProfileService
import org.postgresql.jdbc3.Jdbc3PoolingDataSource
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
open class Pac4jProfileService
{
    companion object {
        private var initializedDataSource: Jdbc3PoolingDataSource? = null

        val salt = "\$2a\$10\$whERBRv1HHJJ5/BEjtKYme"


        val dataSource: Jdbc3PoolingDataSource
            get() {
                if (initializedDataSource == null)
                {
                    initializedDataSource = Jdbc3PoolingDataSource()

                    //TODO: put these in AppProperties
                    initializedDataSource?.url = "jdbc:postgresql://hint_db/hint"
                    initializedDataSource?.user = "hintuser"
                    initializedDataSource?.password = "changeme"
                }
                return initializedDataSource!!
            }
    }

    @Bean
    open fun profileService(): DbProfileService
    {
        return profileService(dataSource)
    }

    fun profileService(source: Jdbc3PoolingDataSource): DbProfileService
    {
        //TODO: Use Libsodium
        return DbProfileService(source, JBCryptPasswordEncoder(salt))
    }
}
