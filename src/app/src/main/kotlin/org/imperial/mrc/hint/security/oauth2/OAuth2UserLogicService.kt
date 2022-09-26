package org.imperial.mrc.hint.security.oauth2

import org.imperial.mrc.hint.caseInsensitiveEmail
import org.imperial.mrc.hint.db.UserRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

interface OAuth2UserLogic
{
    fun validateUser(email: String)
}

@Component
class OAuth2UserLogicService : OAuth2UserLogic
{

    @Autowired
    private lateinit var userRepository: UserRepository

    override fun validateUser(email: String)
    {
        userRepository.getAllUserNames()
            .find { caseInsensitiveEmail(email).matches(it) }
            ?: userRepository.addAuth0User(email)
    }
}
