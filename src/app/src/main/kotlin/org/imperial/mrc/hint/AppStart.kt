package org.imperial.mrc.hint

import org.imperial.mrc.hint.security.SecurePaths
import org.pac4j.core.config.Config
import org.pac4j.springframework.web.SecurityInterceptor
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.context.annotation.Configuration
import org.springframework.http.CacheControl
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import org.springframework.web.servlet.config.annotation.*
import org.springframework.web.servlet.resource.EncodedResourceResolver
import org.springframework.web.servlet.resource.PathResourceResolver

@SpringBootApplication
class HintApplication

// Spring 5 has no CacheControl.immutable() (Spring 6 adds it), so this object gives the header value itself.
// "immutable" tells the browser that it does not have to check the file again when the user reloads the page.
object HashedAssetCacheControl : CacheControl()
{
    override fun getHeaderValue() = "public, max-age=31536000, immutable"
}

fun main(args: Array<String>)
{
    SpringApplication.run(HintApplication::class.java)
}

@Configuration
@EnableWebMvc
class MvcConfig(val config: Config) : WebMvcConfigurer
{
    override fun addResourceHandlers(registry: ResourceHandlerRegistry)
    {
        // The Vite build writes the JS and CSS to public/assets. Each file name has a hash of the file contents,
        // so a changed file gets a new name. Thus the browser can keep these files for a year.
        // When more than one pattern matches a request, Spring uses the most specific pattern,
        // so this handler (not the /public/** handler) serves /public/assets/**.
        registry.addResourceHandler("/public/assets/**")
                .addResourceLocations("file:/static/public/assets/", "file:static/public/assets/")
                .setCacheControl(HashedAssetCacheControl)
                .resourceChain(true)
                .addResolver(EncodedResourceResolver())
                .addResolver(PathResourceResolver())

        // The other files (for example css/app.css, the images and the favicon) have fixed names.
        // They get no Cache-Control header.
        registry.addResourceHandler("/public/**")
                .addResourceLocations("file:/static/public/", "file:static/public/")
                .resourceChain(true)
                .addResolver(EncodedResourceResolver())
                .addResolver(PathResourceResolver())
    }

    override fun addInterceptors(registry: InterceptorRegistry)
    {
        //Ajax endpoints only available to logged in users
        registry.addInterceptor(SecurityInterceptor(config, ""))
                .addPathPatterns(SecurePaths.ADD.pathList())
                .excludePathPatterns(SecurePaths.EXCLUDE.pathList())
        registry.addInterceptor(SecurityInterceptor(config, "githubClient"))
                .addPathPatterns(SecurePaths.ADD_GITHUB.pathList())
    }

    override fun configureAsyncSupport(configurer: AsyncSupportConfigurer)
    {
        val t = ThreadPoolTaskExecutor()
        t.corePoolSize = CORE_POOL_SIZE
        t.maxPoolSize = MAX_POOL_SIZE
        t.queueCapacity = QUEUE_CAPACITY
        t.setAllowCoreThreadTimeOut(true)
        t.keepAliveSeconds = KEEP_ALIVE_SEC
        t.initialize()
        configurer.setTaskExecutor(t)

        configurer.setDefaultTimeout(ASYNC_TIMEOUT_MS)
    }

    companion object
    {
        private const val CORE_POOL_SIZE = 10
        private const val MAX_POOL_SIZE = 100
        private const val QUEUE_CAPACITY = 50
        private const val KEEP_ALIVE_SEC = 120
        private const val ASYNC_TIMEOUT_MS = 10 * 60 * 1000L
    }
}
