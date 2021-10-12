package org.imperial.mrc.hint.clients

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.models.ErrorReport
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

interface Flow
{
    fun notifyTeams(url: String, data: ErrorReport): ResponseEntity<String>
}

@Component
class FlowClient(val objectMapper: ObjectMapper) : FuelClient(""), Flow
{

    override fun standardHeaders(): Map<String, Any>
    {
        return mapOf("Accept" to MediaType.APPLICATION_JSON)
    }

    override fun notifyTeams(url: String, data: ErrorReport): ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(data)

        return postJson(url, json)
    }

}
