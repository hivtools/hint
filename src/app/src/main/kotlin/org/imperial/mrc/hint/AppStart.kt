package org.imperial.mrc.hint

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.imperial.mrc.hint.security.SecurePaths
import org.pac4j.core.config.Config
import org.pac4j.springframework.web.SecurityInterceptor
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.cache.RedisCacheConfiguration
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.RedisSerializationContext
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import org.springframework.web.servlet.config.annotation.*
import org.springframework.web.servlet.resource.EncodedResourceResolver
import org.springframework.web.servlet.resource.PathResourceResolver

@SpringBootApplication
class HintApplication

fun main(args: Array<String>)
{
    SpringApplication.run(HintApplication::class.java)
}

@Configuration
@EnableWebMvc
@EnableCaching
class MvcConfig(val config: Config) : WebMvcConfigurer
{
    @Bean
    fun redisCacheConfiguration(): RedisCacheConfiguration
    {
        val objectMapper = ObjectMapper()
            .registerModule(KotlinModule())
            .registerModule(JavaTimeModule())
            .activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                    .allowIfBaseType(Any::class.java)
                    .build(), ObjectMapper.DefaultTyping.EVERYTHING
            )

        val serializer = GenericJackson2JsonRedisSerializer(objectMapper)

        return RedisCacheConfiguration
            .defaultCacheConfig()
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
    }
    override fun addResourceHandlers(registry: ResourceHandlerRegistry)
    {
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
