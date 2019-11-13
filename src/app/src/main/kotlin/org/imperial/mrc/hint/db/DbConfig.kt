package org.imperial.mrc.hint.db

import org.imperial.mrc.hint.AppProperties
import org.jooq.SQLDialect
import org.jooq.impl.DSL
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.jdbc.DataSourceBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import javax.sql.DataSource

@Configuration
class DbConfig {

    @Bean
    @ConfigurationProperties("spring.datasource")
    fun dataSource(appProperties: AppProperties): DataSource {
        val dataSourceBuilder = DataSourceBuilder.create()
        dataSourceBuilder.username(appProperties.dbUser)
        dataSourceBuilder.password(appProperties.dbPassword)
        return dataSourceBuilder.build()
    }

    fun dataSource(url: String, user: String, password: String): DataSource {
        val dataSourceBuilder = DataSourceBuilder.create()
        dataSourceBuilder.driverClassName("org.postgresql.Driver")
        dataSourceBuilder.url(url)
        dataSourceBuilder.username(user)
        dataSourceBuilder.password(password)
        return dataSourceBuilder.build()
    }
}
