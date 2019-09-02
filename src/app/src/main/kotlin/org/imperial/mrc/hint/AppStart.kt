package org.imperial.mrc.hint

import org.pac4j.core.config.Config
import org.pac4j.springframework.web.SecurityInterceptor
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.EncodedResourceResolver
import org.springframework.web.servlet.resource.PathResourceResolver

@SpringBootApplication
class HintApplication

fun main(args: Array<String>) {
    SpringApplication.run(HintApplication::class.java, *args)
}

@Configuration
@EnableWebMvc
class MvcConfig(val config: Config, val appProperties: AppProperties) : WebMvcConfigurer {
    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/public/**")
                .addResourceLocations("file:/static/public/", "file:static/public/")
                .resourceChain(true)
                .addResolver(EncodedResourceResolver())
                .addResolver(PathResourceResolver())
    }

    override fun addInterceptors(registry: InterceptorRegistry) {
        if (appProperties.useAuth) {
            registry.addInterceptor(SecurityInterceptor(config, "FormClient"))
                    .addPathPatterns("/**")
                    .excludePathPatterns("/login", "/login/", "/password/**", "/callback", "/callback/", "/public/**")
        }
    }
}
