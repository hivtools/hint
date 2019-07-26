package org.imperial.mrc.modelserver.security

import org.pac4j.core.config.Config
import org.pac4j.springframework.web.SecurityInterceptor
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.ComponentScan
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter

@Configuration
@ComponentScan(basePackages = ["org.pac4j.springframework.web"])
class SecurityConfig: WebMvcConfigurerAdapter() {

    @Autowired
    private lateinit  var config: Config

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(SecurityInterceptor(config, "IndirectBasicAuthClient"))
                .addPathPatterns("/")
    }
}