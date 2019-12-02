package org.imperial.mrc.hint

import org.pac4j.core.config.Config
import org.pac4j.springframework.web.SecurityInterceptor
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import org.springframework.web.servlet.config.annotation.*
import org.springframework.web.servlet.resource.EncodedResourceResolver
import org.springframework.web.servlet.resource.PathResourceResolver

@SpringBootApplication
class HintApplication

fun main(args: Array<String>) {
    SpringApplication.run(HintApplication::class.java, *args)
}

@Configuration
@EnableWebMvc
class MvcConfig(val config: Config) : WebMvcConfigurer {
    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/public/**")
                .addResourceLocations("file:/static/public/", "file:static/public/")
                .resourceChain(true)
                .addResolver(EncodedResourceResolver())
                .addResolver(PathResourceResolver())
    }

    override fun addInterceptors(registry: InterceptorRegistry) {
        //Root url - redirect to login if required
        registry.addInterceptor(SecurityInterceptor(config, "FormClient"))
                .addPathPatterns("/")

        //Ajax endpoints - secure, but do not redirect with login form client - return a 401
        registry.addInterceptor(SecurityInterceptor(config, ""))
                .addPathPatterns("/**")
                .excludePathPatterns("/", "/login", "/login/", "/password/**", "/callback", "/callback/", "/public/**")
    }

    override fun configureAsyncSupport(configurer: AsyncSupportConfigurer) {
        val t = ThreadPoolTaskExecutor()
        t.corePoolSize = 10
        t.maxPoolSize = 100
        t.setQueueCapacity(50)
        t.setAllowCoreThreadTimeOut(true)
        t.keepAliveSeconds = 120
        t.initialize()
        configurer.setTaskExecutor(t)
    }
}
