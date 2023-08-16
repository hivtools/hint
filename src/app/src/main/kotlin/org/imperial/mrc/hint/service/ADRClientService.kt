package org.imperial.mrc.hint.service

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.springframework.stereotype.Service

interface ADRService
{
    fun build(): ADRClient
}

@Service
class ADRClientService(
    private val adrClientBuilder: ADRClientBuilder,
    private val appProperties: AppProperties,
) : ADRService
{
    override fun build(): ADRClient
    {
        if (!appProperties.oauth2LoginMethod)
        {
            return adrClientBuilder.build()
        }

        return adrClientBuilder.buildSSO()
    }
}
