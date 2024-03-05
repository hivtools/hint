package org.imperial.mrc.hint

import org.springframework.stereotype.Component
import java.io.File
import java.io.FileNotFoundException
import java.net.URL
import java.util.*

interface AppProperties
{
    val adrANCSchema: String
    val adrARTSchema: String
    val adrPJNZSchema: String
    val adrPopSchema: String
    val adrShapeSchema: String
    val adrSurveySchema: String
    val adrVmmcSchema: String
    val adrOutputZipSchema: String
    val adrOutputSummarySchema: String
    val adrOutputComparisonSchema: String
    val adrDatasetSchema: String
    val adrUrl: String
    val apiUrl: String
    val applicationTitle: String
    val applicationUrl: String
    val emailMode: String
    val emailServer: String
    val emailPort: Int?
    val emailSender: String
    val emailUsername: String
    val emailPassword: String
    val tokenIssuer: String
    val uploadDirectory: String
    val dbUser: String
    val dbPassword: String
    val dbUrl: String
    val issueReportUrl: String
    val supportEmail: String
    val oauth2ClientId: String
    val oauth2ClientSecret: String
    val oauth2ClientUrl: String
    val oauth2ClientAdrServerUrl: String
    val oauth2ClientAudience: String
    val oauth2ClientScope: String
    val oauth2LoginMethod: Boolean
    val fileTypeMappings: Map<String, String>
}

//prevent auto-wiring of default Properties
class HintProperties : Properties()

@Component
class ConfiguredAppProperties(private val props: HintProperties = properties) : AppProperties
{
    final override val adrANCSchema = propString("adr_anc_schema")
    final override val adrARTSchema = propString("adr_art_schema")
    final override val adrPJNZSchema = propString("adr_pjnz_schema")
    final override val adrPopSchema = propString("adr_pop_schema")
    final override val adrShapeSchema = propString("adr_shape_schema")
    final override val adrSurveySchema = propString("adr_survey_schema")
    final override val adrVmmcSchema = propString("adr_vmmc_schema")
    final override val adrOutputZipSchema = propString("adr_output_zip_schema")
    final override val adrOutputSummarySchema = propString("adr_output_summary_schema")
    final override val adrOutputComparisonSchema = propString("adr_output_comparison_schema")
    final override val adrDatasetSchema = propString("adr_schema")
    final override val adrUrl = propString("adr_url")
    final override val apiUrl = propString("hintr_url")
    final override val applicationTitle = propString("application_title")
    final override val applicationUrl = propString("application_url")
    final override val emailMode = propString("email_mode")
    final override val emailServer = propString("email_server")
    final override val emailPort = propString("email_port").toIntOrNull()
    final override val emailSender = propString("email_sender")
    final override val emailUsername = propString("email_username")
    final override val emailPassword = propString("email_password")
    final override val tokenIssuer = propString("token_issuer")
    final override val uploadDirectory = propString("upload_dir")
    final override val dbUser: String = propString("db_user")
    final override val dbPassword: String = propString("db_password")
    final override val dbUrl: String = propString("db_url")
    final override val issueReportUrl: String = propString("issue_report_url")
    final override val supportEmail: String = propString("support_email")
    final override val oauth2ClientId: String = propString("oauth2_client_id")
    final override val oauth2ClientSecret: String = propString("oauth2_client_secret")
    final override val oauth2ClientUrl: String = propString("oauth2_client_url")
    final override val oauth2ClientAudience: String = propString("oauth2_client_audience")
    final override val oauth2ClientAdrServerUrl = propString("oauth2_client_adr_server_url")
    final override val oauth2ClientScope = propString("oauth2_client_scope")
    final override val oauth2LoginMethod = propString("oauth2_login_method").toBoolean()
    final override val fileTypeMappings = mapOf(
            "baseUrl" to adrUrl,
            "anc" to adrANCSchema,
            "programme" to adrARTSchema,
            "pjnz" to adrPJNZSchema,
            "population" to adrPopSchema,
            "shape" to adrShapeSchema,
            "survey" to adrSurveySchema,
            "vmmc" to adrVmmcSchema,
            "outputZip" to adrOutputZipSchema,
            "outputSummary" to adrOutputSummarySchema,
            "outputComparison" to adrOutputComparisonSchema)

    companion object
    {

        fun readProperties(configPath: String): HintProperties
        {
            return HintProperties().apply {
                load(getResource("config.properties").openStream())
                val global = File(configPath)
                if (global.exists())
                {
                    global.inputStream().use { load(it) }
                }
            }
        }

        var configPath = "/etc/hint/config.properties"
        val properties = readProperties(configPath)
    }

    private fun propString(propName: String): String
    {
        return props[propName].toString()
    }
}

fun getResource(path: String): URL
{
    val url: URL? = AppProperties::class.java.classLoader.getResource(path)
    if (url != null)
    {
        return url
    }
    else
    {
        throw FileNotFoundException("Unable to load '$path' as a resource steam")
    }
}
