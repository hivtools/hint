package org.imperial.mrc.hint.clients

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.models.ErrorReport
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

interface Flow
{
    fun notifyTeams(url: String, data: ErrorReport): ResponseEntity<String>
}

@Component
class FlowClient(val objectMapper: ObjectMapper) : FuelClient(), Flow
{

    override fun standardHeaders(): Map<String, Any>
    {
        return emptyMap()
    }

    override fun notifyTeams(url: String, data: ErrorReport): ResponseEntity<String>
    {
        return postJson(url, objectMapper.writeValueAsString(data))
    }

}
