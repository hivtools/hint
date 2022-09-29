package org.imperial.mrc.hint.security.oauth2

import org.imperial.mrc.hint.caseInsensitiveEmail
import org.imperial.mrc.hint.db.UserRepository
import org.springframework.stereotype.Component

interface OAuth2UserLogic
{
    fun validateUser(email: String)
}

@Component
class OAuth2UserLogicService(private val userRepository: UserRepository) : OAuth2UserLogic
{
    override fun validateUser(email: String)
    {
        userRepository.getAllUserNames()
            .find { caseInsensitiveEmail(email).matches(it) }
            ?: userRepository.addOAuth2User(email)
    }
}
