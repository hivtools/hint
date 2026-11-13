# Python port checklist

Every endpoint of the Kotlin app, in the order of the [endpoint index](endpoint-flows.md#endpoint-index). Tick `[ ]` to `[x]` in the Ported column when the endpoint is served by Python (a `location` in [proxy/nginx.conf.template](../proxy/nginx.conf.template)) and the regression suite passes through the proxy, or the differences are written down in the Notes column and in [Differences from Kotlin](#differences-from-kotlin). See [proxy/README.md](../proxy/README.md).

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
| GET | `/metrics` | Plain text hintr worker counts (busy, idle, ...) for monitoring | [ ] | Not going to be ported for now: nothing uses it any more. Kotlin still serves it |
| GET | `/projects/` | Lists the user's projects and their versions | [x] | [D1](#differences-from-kotlin): for a guest Kotlin answers 401 with an empty body |
| GET | `/project/current` | The project and version of the session's current version id (both null if there is none) | [x] | [D1](#differences-from-kotlin), [D4](#differences-from-kotlin). Version comes from `X-Version-Id`, not the session. Versions of the project come back in a different order after a delete (`versions/test_delete_version`) |
| POST | `/project/` | Creates a project | [x] | [D1](#differences-from-kotlin), [D3](#differences-from-kotlin) |
| POST | `/project/{projectId}/rename` | Renames a project | [x] | [D3](#differences-from-kotlin) |
| POST | `/project/{projectId}/note` | Updates a project's note | [x] | [D3](#differences-from-kotlin) |
| POST | `/project/{projectId}/clone` | Copies a project to another user | [x] | [D3](#differences-from-kotlin) |
| DELETE | `/project/{projectId}` | Deletes a project (soft delete) | [x] | [D3](#differences-from-kotlin), [D4](#differences-from-kotlin). Deleting when the session has no current project succeeds (Kotlin: 400). Version rows differ after deleting the current project (`projects/test_delete_current_project_resets_session_version`) |
| POST | `/project/{projectId}/version/` | Creates a new version of a project | [x] | [D3](#differences-from-kotlin), [D4](#differences-from-kotlin) |
| POST | `/project/{projectId}/version/{versionId}/state` | Autosaves the version's state | [x] | [D3](#differences-from-kotlin) |
| POST | `/project/{projectId}/version/{versionId}/promote` | Promotes a version to a new project | [x] | [D3](#differences-from-kotlin) |
| POST | `/project/{projectId}/version/{versionId}/note` | Updates a version's note | [x] | [D3](#differences-from-kotlin) |
| GET | `/project/{projectId}/version/{versionId}` | Loads a saved version and sets it as the session's files | [x] | |
| DELETE | `/project/{projectId}/version/{versionId}` | Deletes a version (soft delete) | [x] | [D4](#differences-from-kotlin) |
| POST | `/session/files` | Sets the session's files from a map of file type to hash | [ ] | |
| POST | `/baseline/pjnz` | Uploads and validates the PJNZ (Spectrum) file | [ ] | |
| GET | `/baseline/pjnz` | Returns the current PJNZ file, validated again | [ ] | |
| DELETE | `/baseline/pjnz` | Removes the PJNZ file from the session | [ ] | |
| POST | `/baseline/shape` | Uploads and validates the shape (boundaries) file | [ ] | |
| GET | `/baseline/shape` | Returns the current shape file, validated again | [ ] | |
| DELETE | `/baseline/shape` | Removes the shape file from the session | [ ] | |
| POST | `/baseline/population` | Uploads and validates the population file | [ ] | |
| GET | `/baseline/population` | Returns the current population file, validated again | [ ] | |
| DELETE | `/baseline/population` | Removes the population file from the session | [ ] | |
| GET | `/baseline/validate` | Validates the baseline files together | [ ] | |
| POST | `/disease/survey` | Uploads and validates the survey file | [ ] | |
| GET | `/disease/survey` | Returns the current survey file, validated again | [ ] | |
| DELETE | `/disease/survey` | Removes the survey file from the session | [ ] | |
| POST | `/disease/programme` | Uploads and validates the ART programme file | [ ] | |
| GET | `/disease/programme` | Returns the current programme file, validated again | [ ] | |
| DELETE | `/disease/programme` | Removes the programme file from the session | [ ] | |
| POST | `/disease/anc` | Uploads and validates the ANC file | [ ] | |
| GET | `/disease/anc` | Returns the current ANC file, validated again | [ ] | |
| DELETE | `/disease/anc` | Removes the ANC file from the session | [ ] | |
| POST | `/disease/vmmc` | Uploads and validates the VMMC file | [ ] | |
| GET | `/disease/vmmc` | Returns the current VMMC file, validated again | [ ] | |
| DELETE | `/disease/vmmc` | Removes the VMMC file from the session | [ ] | |
| GET | `/chart-data/input-time-series/{type}` | Chart data for the input time series of one data type | [x] | [D4](#differences-from-kotlin) |
| GET | `/chart-data/input-comparison` | Chart data comparing the inputs | [x] | [D4](#differences-from-kotlin) |
| GET | `/chart-data/input-population` | Chart data for the population input | [x] | [D4](#differences-from-kotlin) |
| POST | `/meta/review-inputs/{iso3}` | Metadata (plot settings) for the review inputs page | [x] | [D3](#differences-from-kotlin), [D4](#differences-from-kotlin), [D6](#differences-from-kotlin). `types` that is not a list is 400 (Kotlin: 500) |
| GET | `/meta/hintr/version` | hintr, naomi and hint versions (version menu) | [x] | [D5](#differences-from-kotlin) |
| GET | `/model/options` | Model options form definition for the uploaded files | [x] | [D4](#differences-from-kotlin) |
| POST | `/model/validate/options` | Validates the chosen model options | [x] | [D3](#differences-from-kotlin), [D4](#differences-from-kotlin), [D6](#differences-from-kotlin) |
| POST | `/model/run` | Queues a model fit | [x] | [D3](#differences-from-kotlin), [D4](#differences-from-kotlin), [D6](#differences-from-kotlin) |
| GET | `/model/status/{id}` | Status and progress of a model fit | [x] | [D5](#differences-from-kotlin). An empty id (`/model/status/`) is 404 `Not Found` (Kotlin: unexpected error) |
| GET | `/model/result/{id}` | Result of a model fit | [x] | [D5](#differences-from-kotlin) |
| POST | `/model/cancel/{id}` | Cancels a model fit | [x] | [D5](#differences-from-kotlin) |
| GET | `/model/comparison/plot/{id}` | Comparison plot data for a model fit | [x] | [D5](#differences-from-kotlin) |
| GET | `/model/debug/{id}` | Downloads the debug zip for a task (needs a GitHub token) | [ ] | |
| GET | `/calibrate/options/{iso3}` | Calibration options form definition | [x] | [D5](#differences-from-kotlin) |
| POST | `/calibrate/submit/{id}` | Queues a calibration of a model fit | [x] | [D3](#differences-from-kotlin), [D6](#differences-from-kotlin) |
| GET | `/calibrate/status/{id}` | Status and progress of a calibration | [x] | [D5](#differences-from-kotlin) |
| GET | `/calibrate/result/metadata/{id}` | Metadata for the calibrated results | [x] | [D5](#differences-from-kotlin) |
| GET | `/calibrate/plot/{id}` | Calibration plot data | [x] | [D5](#differences-from-kotlin) |
| POST | `/calibrate/result/filteredData/{id}` | Calibrated results filtered by the selected options, read from the results database | [x] | [D3](#differences-from-kotlin), [D6](#differences-from-kotlin), [D7](#differences-from-kotlin), [D8](#differences-from-kotlin). Python asks hintr only for the path (as Kotlin does) and reads the DuckDB file itself, in `HINT_RESULTS_DIR` (the same share hintr writes to, read only) |
| GET | `/calibrate/result/data/{id}/{indicator}` | Calibrated results for one indicator | [ ] | Not going to be ported for now: the front end does not call it (it uses `filteredData`). Kotlin still serves it |
| POST | `/download/submit/{type}/{id}` | Queues a download of an output file (spectrum, coarse output, summary, comparison, ...) | [x] | [D3](#differences-from-kotlin), [D4](#differences-from-kotlin), [D6](#differences-from-kotlin). The version is checked for every type, Kotlin only looks at it for the types that add a file (spectrum, datapack, agyw). A `vmmc` in the body is dropped when the version has no VMMC file (Kotlin passes it on, so the browser could choose a file for hintr to read; `download/test_submit_with_and_without_vmmc_and_pjnz` does not send one). Type `agyw` is not ported, as nothing uses it: Kotlin adds the PJNZ file to it, Python sends it as it is (`download/test_submit_with_and_without_vmmc_and_pjnz`) |
| GET | `/download/status/{id}` | Status of a download | [x] | [D5](#differences-from-kotlin) |
| GET | `/download/result/{id}` | Downloads the finished output file | [x] | [D7](#differences-from-kotlin). Python asks hintr only where the file is (`GET /download/result/path/{id}`, which Kotlin never calls) and sends it from the results folder in pieces. hintr's own call reads the whole file into R's memory |
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
| GET | `/meta/adr/{id}` | Upload metadata for a task, used when pushing to ADR | [x] | [D5](#differences-from-kotlin) |
| POST | `/adr/datasets/{id}/releases` | Creates a release of an ADR dataset | [ ] | |
| POST | `/adr/datasets/{id}/resource/{resourceType}/{downloadId}` | Pushes an input or output file to ADR | [ ] | |
| POST | `/error-report` | Sends an error report to Teams and copies the project to the support user | [ ] | |
| GET | `/public/**` | Static files of the single page app (js, css, images) | [ ] | |

## Differences from Kotlin

The goldens in `contract-tests/goldens` are recorded from the Kotlin app only (`scripts/dev.sh up --no-proxy`, then `test --record`). Replaying them through the proxy shows where Python answers differently. These are written down for now and are to be reviewed together once everything is ported. Each is either to be matched in Python, or accepted and the golden re-recorded as a deliberate quirk. A scenario stops at its first difference, so there may be more behind the ones listed.

- **D1. 401 for a guest or anonymous caller.** Python answers `{"status":"failure","errors":[{"error":"OTHER_ERROR","detail":"Login required"}]}`. Kotlin (pac4j) answers a JSON body with `error: Unauthorized`, `path` and `timestamp` plus a `www-authenticate: Bearer realm="pac4j"` header, or an empty body for `/projects/`. `OPTIONS /project` is 405 with `Allow: POST` in Python, 401 in Kotlin. Tests: `pages_and_session/test_guest_gets_401_on_secured_prefixes`, `test_guest_projects_list_is_401_without_body`, `projects/test_create_project_as_guest_is_401`, `misc_edges/test_head_and_options_requests`, and the "still a guest" steps in `auth/test_login_wrong_password`, `auth/test_logout_destroys_session_and_redirects_to_login`, `sso/test_sso_idp_failures`, `sso/test_sso_logout_redirects_to_idp`.
- **D2. `Accept-Language` negotiation.** Python maps `pt-BR` to Portuguese and `fr;q=0.5` to French. Kotlin answers English for both. Tests: `misc_edges/test_accept_language_variants_for_hint_errors[pt-BR]` and `[q-value]`.
- **D3. Text of the "unexpected error" message.** The user-facing part is the same. Kotlin appends the Spring or Jackson reason (for example `Required request body is missing: public org.springframework...`), Python only logs the reason. Tests: the `*_errors` and "no body" / "missing ..." steps in `projects/` and `versions/`.
- **D4. No version in the session.** Python takes the version from `X-Version-Id` and keeps nothing in the Kotlin session. Deleting a project from a session with no current project succeeds (Kotlin: 400). After a failed new version the session still points at a version that exists, so the next upload works (Kotlin: 500). `/project/current` without the header is `null` (Kotlin: the session's version). Tests: `projects/test_delete_project_fails_with_400_when_session_has_no_current_project_but_still_deletes`, `versions/test_failed_new_version_leaves_session_pointing_at_a_nonexistent_version`, `version_header/test_without_the_header_the_version_in_the_session_is_used`.
- **D5. hintr failures (the passthrough endpoints).** (a) A body that is not JSON, such as the HTML 502 or 504 page of a gateway, gives `Could not parse response.` (500). Kotlin gives ADR wording, `Failed to get response from ADR, try again later.` (502) or `ADR request timed out` (504), because hintr and ADR answers share one converter there. (b) A JSON error with no `status` field gives the JSON text as the message. Kotlin gives an empty message. (c) Python calls hintr once when the connection is dropped, Kotlin twice. Tests: `hintr_faults/test_hintr_non_json_error_bodies`, `test_hintr_connection_dropped`, `test_hintr_down_for_each_validation_endpoint`, `model/test_status_result_of_unknown_ids`.
- **D6. Requests with a body that is not valid, and wrong methods.** For a POST that takes a JSON body, a body that is missing or has the wrong fields is 400 in both. A field of the wrong type is 400 in Python where Kotlin gives 500 (`meta/review-inputs` with `types` as a string). A wrong method, such as GET on a POST only path, is 405 `Method Not Allowed` with an `Allow` header in Python, where Kotlin gives its "unexpected error" text and no `Allow`. Tests: `chart_data/test_review_inputs_metadata_errors` ("types not a list"), `model/test_validate_options_bad_requests` ("wrong method").
- **D7. Endpoints that read the results folder.** (a) When hintr cannot give the path of a result (an unknown task id, or one that is not a finished calibration or download), Python answers hintr's own failure (400, as it does for the passthrough endpoints). Kotlin's `filteredData` answers 500 "unexpected error", because it reads the path out of a failure. (b) `download/result`: Python makes one call to hintr, `GET /download/result/path/{id}`, and sends the file from the results folder in pieces. Kotlin makes a `HEAD` and a `GET /download/result/{id}`, and hintr reads the whole file into memory. The content type (`application/octet-stream`) and the `Content-Disposition` (`attachment; filename="<areas>_<label>_<yyyymmdd-hhmm><ext>"`, the time made in Python in UTC) are the same. Python's answer also has `Content-Length`, `ETag`, `Last-Modified` and supports range requests. A `HEAD` to hint is 405 (Kotlin answers it as a `GET`), the Vue app only uses `GET`. (c) A result file that hintr names but is not in the results folder: `filteredData` is 400 `missingCalibrateData`, as in Kotlin. `download/result` is 500 "unexpected error" with the path in the log. The contract tests do not cover either. Tests: `calibrate/test_filtered_data_bad_requests` ("unknown id", "failed calibration id"), and the outbound calls of the "result" steps in `downloads/test_status_and_result_of_each_type[*]`, `test_download_result_and_metadata_errors` and `test_download_as_guest`. The rows of `filteredData` are the same as Kotlin's, byte for byte on the Malawi mock fit (the numbers are sent at 32 bit precision, as Kotlin did).
- **D8. No response compression (held off for now).** Kotlin compresses JSON responses of 1 KB or more (`server.compression.*` in `application.properties`, applied when the browser sends `Accept-Encoding: gzip`). The Python API and the nginx proxy compress nothing, so every large JSON answer is sent whole. Measured on the Malawi mock calibration with `filteredData`: 20,493 rows are 0.57 MB on the wire from Kotlin and 4.31 MB from Python, and all 350,244 rows are 10.0 MB and 73.0 MB. Python is still about 2 to 3 times faster to answer (106 ms against 234 to 299 ms, and 1.1 s against 3.6 to 4.3 s), but on a slow connection the bytes matter more than that. It affects every Python endpoint with a big body (the chart data, the review inputs metadata, the model and calibrate results, as well as `filteredData`). This is R11, step 3 in [target-design.md](target-design.md). Not done yet. Open: where to compress. nginx is the cheaper place (compiled, and level 1 to 4 is fast), whereas Starlette's `GZipMiddleware` defaults to level 9, which is slow on 70 MB. Either way it must skip the file downloads, which are already compressed.
