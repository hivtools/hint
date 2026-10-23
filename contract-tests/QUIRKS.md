# Quirks: keep or fix

The contract suite records 30 behaviours of the Kotlin app that look like bugs or oddities (marked `@pytest.mark.quirk`;
the agent that wrote the suite counted 29, the table in COVERAGE.md has 30 rows). This file proposes what to do with
each one. It is a proposal: nothing here has been changed except where stated.

Recommendations:

* **Fix now**: small, independent change in the Kotlin app. Security, data exposure, or a bug that breaks real users.
  The golden for that test must be updated in the same change.
* **Fix in port**: change it when the endpoint moves to Python. The Vue app does not depend on it (checked where noted).
  Update the golden when the Python endpoint replaces the Kotlin one.
* **Keep**: something depends on it. The Python port must reproduce it exactly.
* **Drop**: goes away with a feature that is being removed (password login and password reset; production is SSO only).
* **Decide**: needs a product or operations decision.

Vue checks were done by searching `src/app/static/src/app` on 2026-10-22.

## Fix now (5)

| # | Test | Behaviour | Why |
| --- | --- | --- | --- |
| 16 | `pages_and_session/test_login_page_does_not_escape_username` | `username` query parameter is written into the login form unescaped. | Reflected XSS on the login page. Escape in `login.ftl` (`${username?html}` or an HTML output format). |
| 26 | `sso/test_model_debug_requires_a_github_bearer_token` | Any logged-in session passes the interceptor that should accept only GitHub-team tokens. | Any user who knows a task id can download its debug bundle. `DebugController` also lacks a `return` after `sendError(401)`. Check the profile came from the GitHub client. |
| 30 | `versions/test_promote_does_not_check_version_or_ownership` | `promote` never checks the version or its owner. | Another user's version can be copied into your project. `copyVersion` already has the check. The UI only sends real ids. |
| 21 | `projects/test_clone_includes_soft_deleted_versions` | Cloning (sharing) a project also copies versions the owner deleted. | A version the owner deleted is handed to the recipient. Skip deleted versions. |
| 25 | `sso/test_sso_login_with_different_case_email_matches_user_but_keeps_idp_case` | The user is found case-insensitively, but the session id keeps the IdP's spelling, so creating a project fails on the foreign key. | Breaks real users whose IdP email differs in case from the stored one. Use the stored user's id. |

## Fix in port (16)

| # | Test | Behaviour | Why |
| --- | --- | --- | --- |
| 1 | `adr_browse/test_adr_key_longer_than_rsa_block_is_a_500` | Keys are RSA-encrypted directly, so keys over about 446 bytes give a 500. | Return a 400. Keep decrypting existing stored keys exactly as now. |
| 2 | `adr_browse/test_datasets_without_stored_key` | The "no ADR key" error shows the untranslated key `noADRKey`. | Add translations. The Vue app never mentions `noADRKey` (searched). |
| 3 | `adr_import/test_import_redirect_to_login_page_is_followed_and_saved` | The download client follows redirects, so a login page is saved as the file. | Detect the redirect or HTML and return the "no permission" error. |
| 6 | `baseline_files/test_failed_validation_still_replaces_the_stored_file` | The upload is attached before hintr validates it, so a rejected file replaces the good one. | Only attach after validation passes. Check how the Vue upload error state reacts first. |
| 9 | `disease_files/test_failed_validation_still_replaces_stored_file` | Same as 6, for survey, programme, ANC and VMMC. | Same as 6. |
| 7 | `baseline_files/test_upload_before_opening_app_fails_because_version_row_missing` | A new session has no `project_version` row until `GET /`, so an upload gives a 500. | Create the row on first use. |
| 11 | `file_storage/test_file_row_present_but_file_missing_on_disk` | If the file disappears, re-uploading the same content does not restore it. | Write the file first, then the row, and re-write if missing (design rule R2). |
| 12 | `hintr_faults/test_hintr_error_json_with_various_status_codes` | Any hintr status above 404 becomes 500. | Map upstream errors to 502 and 503. Low priority. |
| 13 | `hintr_faults/test_hintr_non_json_error_bodies` | 502 and 504 pages from hintr are reported as "Failed to get response from ADR". | Wrong wording for hintr. Use a hintr message. |
| 17 | `pages_and_session/test_missing_static_asset_is_500_not_404` | A missing `/public/**` file gives a 500. | Return 404. Static files will come from nginx or a CDN anyway. |
| 19 | `projects/test_rename_without_note_clears_the_note` | Rename without `note` wipes the stored note. | The UI always sends `note` (searched), so keeping the old note is safe. |
| 20 | `projects/test_delete_project_fails_with_400_when_session_has_no_current_project_but_still_deletes` | The project is deleted, then the request fails with 400. | Return success. |
| 23 | `session_files/test_set_files_accepts_arbitrary_type_keys` | The type key is not validated. | Accept only the known file types. Confirm the UI sends only those. |
| 27 | `versions/test_failed_new_version_leaves_session_pointing_at_a_nonexistent_version` | The session version is switched before the copy, so a failed copy breaks the session. | Switch after the copy succeeds. |
| 28 | `versions/test_open_version_without_saved_state_is_a_500` | A version that never had state saved cannot be opened (500). | Return a clear error or a null state. Check what the UI does. |
| 29 | `versions/test_open_soft_deleted_version_still_works` | `GET` version ignores the deleted flag. | Return 404. |

## Keep (6)

| # | Test | Behaviour | Why |
| --- | --- | --- | --- |
| 24 | `sso/test_sso_login_creates_user_and_session` | The `redirect_uri` sent to the IdP is `/callback/oauth2Client/oauth2Client` (name twice). | Auth0 probably has this exact URL registered as an allowed callback. Change it only together with the Auth0 settings. |
| 22 | `session_files/test_set_files_has_no_ownership_check_on_hashes` | Any hash in the `file` table can be attached by any session. | Rehydrate from someone else's output zip needs this today. It is a security-design item, not a quick fix. Revisit with the file design (unguessable names, tracking who has seen a hash). |
| 10 | `file_storage/test_filename_without_dot_uses_whole_name_as_extension` | A name with no dot becomes `HASH.<whole name>`. | File names must match old projects. |
| 18 | `projects/test_create_project_response_drops_note_and_reports_uploaded_null` | The create response has `note` null and the key `uploaded`. | The UI reads `uploaded` on the project list (`ProjectHistory.vue`). Fix together with a UI change. |
| 8 | `calibrate/test_calibrate_results_with_a_model_fit_id` | A fit id is accepted where a calibrate id is expected. | hintr behaviour. It changes when tasks move to TaskAPI. |
| 15 | `model/test_task_ids_are_a_single_namespace` | `model/status` and `model/result` accept calibrate task ids. | hintr has one task store. Same as 8. |

## Drop (2)

| # | Test | Behaviour | Why |
| --- | --- | --- | --- |
| 4 | `auth/test_login_get_on_callback_without_credentials` | `GET /callback/formClient` without credentials redirects to login. | Password login is dev-only in the new design. |
| 5 | `auth/test_password_endpoints_answer_text_plain_with_a_json_body` | The password endpoints return JSON as `text/plain`. | Password reset is removed (SSO only). |

## Decide (1)

| # | Test | Behaviour | Question |
| --- | --- | --- | --- |
| 14 | `hintr_faults/test_metrics_with_unexpected_worker_status` | `/metrics` always answers 200. A failing worker status is reported as zero workers. | Does anything monitor `/metrics`? I found no consumer in `hint-deploy-azure` (not conclusive). If something does, a 503 when hintr is down may be better. |

## Also found (no test)

* `ADRClientBuilder.buildSSO` logged the user's SSO access token at INFO. Removed on 2026-10-22, with a unit test that
  fails if the token is ever logged.
