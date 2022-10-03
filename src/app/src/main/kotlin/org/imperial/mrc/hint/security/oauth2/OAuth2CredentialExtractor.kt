package org.imperial.mrc.hint.security.oauth2

import org.imperial.mrc.hint.exceptions.UserException
import org.pac4j.core.client.IndirectClient
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.credentials.Credentials
import org.pac4j.oauth.config.OAuth20Configuration
import org.pac4j.oauth.config.OAuth20Configuration.STATE_REQUEST_PARAMETER
import org.pac4j.oauth.credentials.extractor.OAuth20CredentialsExtractor
import java.util.*

class OAuth2CredentialExtractor(
    val config: OAuth20Configuration,
    client: IndirectClient,
) : OAuth20CredentialsExtractor(config, client)
{
    override fun extract(context: WebContext, sessionStore: SessionStore): Optional<Credentials>
    {
        val stateParam = STATE_REQUEST_PARAMETER

        val stateParameter = context.getRequestParameter(stateParam)

        if (!stateParameter.isPresent)
        {
            throw UserException("Auth0 state parameter must be provided")
        }
        val sessionStateParameter = sessionStore.get(context, stateParam)

        if (sessionStateParameter.get() != stateParameter.get())
        {
            throw UserException("Auth0 State parameter mismatch possible threat of cross-site request forgery")
        }

        return super.getOAuthCredentials(context, sessionStore)
    }
}