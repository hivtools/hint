"""GET /adr/schemas (app/routers/adr.py): config only, so it needs no identity, no version, no database and no hintr."""


async def test_gives_the_resource_types_and_the_address_of_adr(anonymous_client):
    r = await anonymous_client.get("/adr/schemas")

    assert r.status_code == 200
    assert r.json() == {
        "status": "success",
        "errors": [],
        "data": {
            "baseUrl": "https://dev.adr.fjelltopp.org/",
            "anc": "inputs-unaids-anc",
            "programme": "inputs-unaids-art",
            "pjnz": "inputs-unaids-spectrum-file",
            "population": "inputs-unaids-population",
            "shape": "inputs-unaids-geographic",
            "survey": "inputs-unaids-survey",
            "outputZip": "inputs-unaids-naomi-output-zip",
            "outputSummary": "inputs-unaids-naomi-report",
            "outputComparison": "inputs-unaids-naomi-comparison-report",
        },
    }


async def test_has_no_vmmc_type(anonymous_client):
    # Kotlin stopped sending it when VMMC files were removed
    assert "vmmc" not in (await anonymous_client.get("/adr/schemas")).json()["data"]


async def test_the_settings_are_what_is_sent(anonymous_client, settings):
    settings.adr_url = "https://adr.example/"
    settings.adr_pjnz_schema = "my-pjnz"
    settings.adr_output_zip_schema = "my-zip"

    data = (await anonymous_client.get("/adr/schemas")).json()["data"]

    assert data["baseUrl"] == "https://adr.example/"
    assert data["pjnz"] == "my-pjnz"
    assert data["outputZip"] == "my-zip"
    assert data["anc"] == "inputs-unaids-anc"


async def test_a_trailing_slash_is_not_an_endpoint_of_the_api(anonymous_client):
    # Kotlin keeps serving it (see the note in the router). FastAPI would answer a redirect to the path without the slash
    r = await anonymous_client.get("/adr/schemas/")
    assert r.status_code == 307
    assert r.headers["location"].endswith("/adr/schemas")
