package org.imperial.mrc.hint.security.oauth2

import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.exception.http.RedirectionAction
import org.pac4j.core.logout.LogoutActionBuilder
import org.pac4j.core.profile.UserProfile
import org.pac4j.core.util.HttpActionHelper
import java.util.*

class OAuth2LogoutActionBuilder(
    private val authRedirection: OAuth2AuthenticationRedirection
) : LogoutActionBuilder
{
    override fun getLogoutAction(
        context: WebContext?,
        sessionStore: SessionStore?,
        currentProfile: UserProfile?,
        targetUrl: String?,
    ): Optional<RedirectionAction>
    {
        return Optional.of(HttpActionHelper.buildRedirectUrlAction(context, authRedirection.oauth2LogoutRedirect()))
    }
}
