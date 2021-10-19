package org.imperial.mrc.hint.clients

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.models.ErrorReport
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

interface FlowClient
{
    fun notifyTeams(data: ErrorReport): ResponseEntity<String>
}

@Component
class FuelFlowClient(
        val objectMapper: ObjectMapper,
        appProperties: AppProperties
) : FuelClient(appProperties.issueReportUrl), FlowClient
{

    override fun standardHeaders(): Map<String, Any>
    {
        return emptyMap()
    }

    override fun notifyTeams(data: ErrorReport): ResponseEntity<String>
    {
        return postJson(null, objectMapper.writeValueAsString(data))
    }

}
