package org.imperial.mrc.hint.security.oauth2

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.stereotype.Component

@Configuration
@EnableWebSecurity
@Component
class SecurityConfiguration
{
    @Bean
    @Throws(Exception::class)
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http.authorizeRequests()
            .mvcMatchers("/oauth2").permitAll()
            .anyRequest().authenticated()
            .and().oauth2Login().and().build();
    }
}