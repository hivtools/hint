package org.imperial.mrc.hint.security

import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.oauth2.clients.HintClientsContext
import org.imperial.mrc.hint.security.oauth2.clients.OAuth2Client
import org.pac4j.core.client.Clients
import org.pac4j.core.client.IndirectClient
import org.pac4j.core.config.Config
import org.pac4j.core.http.callback.PathParameterCallbackUrlResolver
import org.pac4j.http.client.indirect.FormClient
import org.pac4j.jee.context.session.JEESessionStore
import org.pac4j.sql.profile.service.DbProfileService

class HintPac4jConfigService(
    private val profileService: DbProfileService,
    private val userRepository: UserRepository,
)
{
    fun getConfig(): Config
    {
        val clients = Clients("/callback", getFormClient(), getAuth2Client())
        return Config(clients).apply {
            sessionStore = JEESessionStore.INSTANCE
        }
    }

    private fun getFormClient(): FormClient
    {
        val formClient = FormClient("/login", profileService)
        formClient.callbackUrlResolver = PathParameterCallbackUrlResolver()
        return formClient
    }

    private fun getAuth2Client(): IndirectClient
    {
        val oAuthClient = OAuth2Client(userRepository)
        val client = HintClientsContext(oAuthClient)
        return client.getIndirectClient()
    }
}
