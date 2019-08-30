package org.imperial.mrc.hint.security

import org.pac4j.core.client.Clients
import org.pac4j.core.config.Config
import org.pac4j.core.context.session.J2ESessionStore
import org.pac4j.http.client.indirect.FormClient
import org.pac4j.springframework.web.SecurityInterceptor
import org.pac4j.sql.profile.service.DbProfileService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import javax.sql.DataSource

@Configuration
@ComponentScan(basePackages = ["org.pac4j.springframework.web", "org.pac4j.springframework.component"])
class Pac4jConfig {

    @Bean
    fun getProfileService(@Autowired dataSource: DataSource): DbProfileService {
        return DbProfileService(TransactionAwareDataSourceProxy(dataSource), SecurePasswordEncoder())
    }

   @Bean
    fun getPac4jConfig(@Autowired profileService: DbProfileService): Config {
        val formClient = FormClient("/login", profileService)
        val clients = Clients("/callback", formClient)
        return Config(clients).apply {
            sessionStore = J2ESessionStore()
        }
    }
}

@Configuration
class HintWebMvcConfig(val config: Config): WebMvcConfigurer {

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(SecurityInterceptor(config, "FormClient"))
                .addPathPatterns("/**")
                .excludePathPatterns("/login", "/login/", "/password/**", "/callback", "/callback/", "/public/**")
    }
}