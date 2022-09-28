package org.imperial.mrc.hint.security.oauth2

import org.imperial.mrc.hint.AppProperties
import org.pac4j.core.context.WebContext
import org.pac4j.core.context.session.SessionStore
import org.pac4j.core.exception.http.RedirectionAction
import org.pac4j.core.logout.LogoutActionBuilder
import org.pac4j.core.profile.UserProfile
import org.pac4j.core.util.HttpActionHelper
import java.util.*

class OAuth2LogoutActionBuilder(
    appProperties: AppProperties
) : LogoutActionBuilder, OAuth2AuthenticationRedirection(appProperties)
{
    override fun getLogoutAction(
        context: WebContext?,
        sessionStore: SessionStore?,
        currentProfile: UserProfile?,
        targetUrl: String?,
    ): Optional<RedirectionAction>
    {
        return Optional.of(HttpActionHelper.buildRedirectUrlAction(context, oauth2LogoutRedirect()))
    }
}
