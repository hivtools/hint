package org.imperial.mrc.hint.security.oauth2

import org.springframework.context.annotation.Bean
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain

@EnableWebSecurity
class SecurityConfiguration
{
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http.authorizeRequests()
            .mvcMatchers("/oauth2").permitAll()
            .anyRequest().authenticated()
            .and().oauth2Login().and().build();
    }
}