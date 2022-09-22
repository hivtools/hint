package org.imperial.mrc.hint.security.oauth2

import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.logic.UserLogic
import org.springframework.beans.factory.annotation.Autowired

interface OAuth2UserLogic
{
    fun checkUserExist(email: String): Boolean
}

object OAuth2UserLogicService: OAuth2UserLogic
{
    @Autowired
    lateinit var userRepository: UserRepository

    override fun checkUserExist(email: String): Boolean
    {
        val caseInsensitiveEmail = Regex("(?i)${email}")

        val userExist = userRepository.getAllUserNames()
            .find { caseInsensitiveEmail.matches(it) }

        if (userExist.isNullOrBlank())
        {
            userRepository
        }

        println(userExist)

        return userExist.isNullOrBlank()
    }


}