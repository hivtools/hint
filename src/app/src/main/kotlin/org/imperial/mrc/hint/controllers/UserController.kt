package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.SuccessResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
class UserController(private val userLogic: UserLogic)
{

    @GetMapping("/user/{email}/exists")
    @ResponseBody
    fun userExists(@PathVariable("email") email: String): SuccessResponse
    {

        val user = userLogic.getUser(email)
        return SuccessResponse(user != null)
    }
}
