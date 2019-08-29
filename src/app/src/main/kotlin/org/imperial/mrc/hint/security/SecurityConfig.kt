package org.imperial.mrc.hint.security

import org.imperial.mrc.hint.AppProperties
import org.pac4j.core.config.Config
import org.pac4j.springframework.web.SecurityInterceptor
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class SecurityConfig(val config: Config, val appProperties: AppProperties): WebMvcConfigurer {

    override fun addInterceptors(registry: InterceptorRegistry) {
        if (appProperties.useAuth) {
            registry.addInterceptor(SecurityInterceptor(config, "FormClient"))
                    .addPathPatterns("/**")
                    .excludePathPatterns("/login", "/login/", "/password/**", "/callback", "/callback/", "/public/**")
        }
    }
}
