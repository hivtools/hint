package org.imperial.mrc.hint.security

import org.pac4j.core.config.Config
import org.pac4j.springframework.web.SecurityInterceptor
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
open class SecurityConfig(val config: Config): WebMvcConfigurer {
    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(SecurityInterceptor(config, "FormClient"))
                .addPathPatterns("/")
    }
}
