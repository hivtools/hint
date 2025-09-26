package org.imperial.mrc.hint.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.exceptions.AdrException
import org.imperial.mrc.hint.models.AdrResource
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.io.InputStream

interface ADRService
{
    fun build(): ADRClient
}

@Service
class ADRClientService(
    private val adrClientBuilder: ADRClientBuilder,
    private val appProperties: AppProperties
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

fun getFileBytes(adr: ADRClient, resource: AdrResource): InputStream
{
    val response = adr.getInputStream(resource.url)

    if (response.statusCode() != HttpStatus.OK.value())
    {
        /**
         * When a user is unauthenticated or lack required permission, the user gets redirected
         * to auth0 login page. handleAdrException handles permission and unexpected ADR errors
         */
        if (response.statusCode() == HttpStatus.FOUND.value())
        {
            throw AdrException(
                "noPermissionToAccessResource",
                HttpStatus.valueOf(response.statusCode()),
                resource.url
            )
        }

        throw AdrException("adrResourceError", HttpStatus.valueOf(response.statusCode()), resource.url)
    }
    return response.body()
}
