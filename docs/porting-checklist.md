# Python port checklist

Every endpoint of the Kotlin app, in the order of the [endpoint index](endpoint-flows.md#endpoint-index). Tick `[ ]` to `[x]` in the Ported column when the endpoint is served by Python (a `location` in [proxy/nginx.conf.template](../proxy/nginx.conf.template)) and the regression suite passes through the proxy. See [proxy/README.md](../proxy/README.md).

96 endpoints. Flows, hintr calls and Redis use for each are in [endpoint-flows.md](endpoint-flows.md).

| Method | Path | What it does | Ported | Notes |
| --- | --- | --- | --- | --- |
| GET | `/` | Serves the single page app (also /projects, /accessibility, /privacy). Creates the session's version row | [ ] | |
| GET | `/login` | Serves the login page | [ ] | |
| GET | `/oauth2` | Redirects to Auth0 to log in | [ ] | |
| GET | `/register` | Redirects to Auth0 to sign up | [ ] | |
| GET | `/sso` | Whether this server uses Auth0 single sign-on (true/false) | [ ] | |
| POST | `/callback/formClient` | Password login (pac4j) | [ ] | |
| GET | `/callback/oauth2Client` | Auth0 login callback: exchanges the code for a token (pac4j) | [ ] | |
| GET | `/logout` | Logs out and ends the session; Auth0 central logout (pac4j) | [ ] | |
| GET | `/password/forgot-password` | Serves the forgot password page | [ ] | |
| POST | `/password/request-reset-link` | Emails a password reset link | [ ] | |
| GET | `/password/reset-password` | Serves the reset password page for a token | [ ] | |
| POST | `/password/reset-password` | Sets a new password using a reset token | [ ] | |
| GET | `/user/{email}/exists` | Whether a user with this email exists | [ ] | |
| GET | `/metrics` | Plain text hintr worker counts (busy, idle, ...) for monitoring | [ ] | |
| GET | `/projects/` | Lists the user's projects and their versions | [ ] | |
| GET | `/project/current` | The project and version of the session's current version id (both null if there is none) | [ ] | |
| POST | `/project/` | Creates a project | [ ] | |
| POST | `/project/{projectId}/rename` | Renames a project | [ ] | |
| POST | `/project/{projectId}/note` | Updates a project's note | [ ] | |
| POST | `/project/{projectId}/clone` | Copies a project to another user | [ ] | |
| DELETE | `/project/{projectId}` | Deletes a project (soft delete) | [ ] | |
| POST | `/project/{projectId}/version/` | Creates a new version of a project | [ ] | |
| POST | `/project/{projectId}/version/{versionId}/state` | Autosaves the version's state | [ ] | |
| POST | `/project/{projectId}/version/{versionId}/promote` | Promotes a version to a new project | [ ] | |
| POST | `/project/{projectId}/version/{versionId}/note` | Updates a version's note | [ ] | |
| GET | `/project/{projectId}/version/{versionId}` | Loads a saved version and sets it as the session's files | [ ] | |
| DELETE | `/project/{projectId}/version/{versionId}` | Deletes a version (soft delete) | [ ] | |
| POST | `/session/files/` | Sets the session's files from a map of file type to hash | [ ] | |
| POST | `/baseline/pjnz/` | Uploads and validates the PJNZ (Spectrum) file | [ ] | |
| GET | `/baseline/pjnz/` | Returns the current PJNZ file, validated again | [ ] | |
| DELETE | `/baseline/pjnz/` | Removes the PJNZ file from the session | [ ] | |
| POST | `/baseline/shape/` | Uploads and validates the shape (boundaries) file | [ ] | |
| GET | `/baseline/shape/` | Returns the current shape file, validated again | [ ] | |
| DELETE | `/baseline/shape/` | Removes the shape file from the session | [ ] | |
| POST | `/baseline/population/` | Uploads and validates the population file | [ ] | |
| GET | `/baseline/population/` | Returns the current population file, validated again | [ ] | |
| DELETE | `/baseline/population/` | Removes the population file from the session | [ ] | |
| GET | `/baseline/validate/` | Validates the baseline files together | [ ] | |
| POST | `/disease/survey/` | Uploads and validates the survey file | [ ] | |
| GET | `/disease/survey/` | Returns the current survey file, validated again | [ ] | |
| DELETE | `/disease/survey/` | Removes the survey file from the session | [ ] | |
| POST | `/disease/programme/` | Uploads and validates the ART programme file | [ ] | |
| GET | `/disease/programme/` | Returns the current programme file, validated again | [ ] | |
| DELETE | `/disease/programme/` | Removes the programme file from the session | [ ] | |
| POST | `/disease/anc/` | Uploads and validates the ANC file | [ ] | |
| GET | `/disease/anc/` | Returns the current ANC file, validated again | [ ] | |
| DELETE | `/disease/anc/` | Removes the ANC file from the session | [ ] | |
| POST | `/disease/vmmc/` | Uploads and validates the VMMC file | [ ] | |
| GET | `/disease/vmmc/` | Returns the current VMMC file, validated again | [ ] | |
| DELETE | `/disease/vmmc/` | Removes the VMMC file from the session | [ ] | |
| GET | `/chart-data/input-time-series/{type}` | Chart data for the input time series of one data type | [ ] | |
| GET | `/chart-data/input-comparison` | Chart data comparing the inputs | [ ] | |
| GET | `/chart-data/input-population` | Chart data for the population input | [ ] | |
| POST | `/meta/review-inputs/{iso3}` | Metadata (plot settings) for the review inputs page | [ ] | |
| GET | `/meta/hintr/version` | hintr, naomi and hint versions (version menu) | [ ] | |
| GET | `/model/options/` | Model options form definition for the uploaded files | [ ] | |
| POST | `/model/validate/options/` | Validates the chosen model options | [ ] | |
| POST | `/model/run/` | Queues a model fit | [ ] | |
| GET | `/model/status/{id}` | Status and progress of a model fit | [ ] | |
| GET | `/model/result/{id}` | Result of a model fit | [ ] | |
| POST | `/model/cancel/{id}` | Cancels a model fit | [ ] | |
| GET | `/model/comparison/plot/{id}` | Comparison plot data for a model fit | [ ] | |
| GET | `/model/debug/{id}` | Downloads the debug zip for a task (needs a GitHub token) | [ ] | |
| GET | `/calibrate/options/{iso3}` | Calibration options form definition | [ ] | |
| POST | `/calibrate/submit/{id}` | Queues a calibration of a model fit | [ ] | |
| GET | `/calibrate/status/{id}` | Status and progress of a calibration | [ ] | |
| GET | `/calibrate/result/metadata/{id}` | Metadata for the calibrated results | [ ] | |
| GET | `/calibrate/plot/{id}` | Calibration plot data | [ ] | |
| POST | `/calibrate/result/filteredData/{id}` | Calibrated results filtered by the selected options, read from the results database | [ ] | |
| GET | `/calibrate/result/data/{id}/{indicator}` | Calibrated results for one indicator | [ ] | |
| POST | `/download/submit/{type}/{id}` | Queues a download of an output file (spectrum, coarse output, summary, comparison, ...) | [ ] | |
| GET | `/download/status/{id}` | Status of a download | [ ] | |
| GET | `/download/result/{id}` | Downloads the finished output file | [ ] | |
| POST | `/rehydrate/zip` | Loads a project from an uploaded output zip | [ ] | |
| POST | `/rehydrate/adr` | Loads a project from an output zip on ADR | [ ] | |
| GET | `/adr/key` | Gets the user's saved ADR API key | [ ] | |
| POST | `/adr/key` | Saves the user's ADR API key | [ ] | |
| DELETE | `/adr/key` | Deletes the user's ADR API key | [ ] | |
| GET | `/adr/schemas` | ADR resource type names for each file type (from config) | [ ] | |
| GET | `/adr/datasets` | Searches ADR datasets | [ ] | |
| GET | `/adr/datasets/{id}` | One ADR dataset and its resources | [ ] | |
| GET | `/adr/datasets/{id}/releases` | Releases of an ADR dataset | [ ] | |
| GET | `/adr/orgs` | ADR organisations the user has a permission on | [ ] | |
| POST | `/adr/pjnz` | Imports the PJNZ file from ADR | [ ] | |
| POST | `/adr/shape` | Imports the shape file from ADR | [ ] | |
| POST | `/adr/population` | Imports the population file from ADR | [ ] | |
| POST | `/adr/survey` | Imports the survey file from ADR | [ ] | |
| POST | `/adr/programme` | Imports the programme file from ADR | [ ] | |
| POST | `/adr/anc` | Imports the ANC file from ADR | [ ] | |
| POST | `/adr/vmmc` | Imports the VMMC file from ADR | [ ] | |
| POST | `/adr/output` | Imports an output zip from ADR | [ ] | |
| GET | `/meta/adr/{id}` | Upload metadata for a task, used when pushing to ADR | [ ] | |
| POST | `/adr/datasets/{id}/releases` | Creates a release of an ADR dataset | [ ] | |
| POST | `/adr/datasets/{id}/resource/{resourceType}/{downloadId}` | Pushes an input or output file to ADR | [ ] | |
| POST | `/error-report` | Sends an error report to Teams and copies the project to the support user | [ ] | |
| GET | `/public/**` | Static files of the single page app (js, css, images) | [ ] | |
