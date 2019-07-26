package org.imperial.mrc.modelserver.security

import org.pac4j.core.authorization.authorizer.IsAuthenticatedAuthorizer
import org.pac4j.core.client.Clients
import org.pac4j.core.config.Config
import org.pac4j.core.engine.LogoutLogic
import org.pac4j.http.client.indirect.IndirectBasicAuthClient
import org.pac4j.http.credentials.authenticator.test.SimpleTestUsernamePasswordAuthenticator
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration


@Configuration
@ComponentScan(basePackages = ["org.pac4j.springframework.web"])
class Pac4jConfig{
   @Bean
   fun config(): Config
   {
       val indirectClient = IndirectBasicAuthClient(SimpleTestUsernamePasswordAuthenticator())
       val clients = Clients("/callback", indirectClient)
       val config =  Config(clients)
       return config
   }
}