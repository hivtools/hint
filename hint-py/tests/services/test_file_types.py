from app.schemas import FileType
from app.services.file_types import (
    INPUT_FILE_TYPES,
    OUTPUT_FILE_TYPES,
    OUTPUT_ZIP,
    input_file_type_on_adr,
    is_output_on_adr,
    upload_file_types,
)
from app.utils.byte_limit import MB


def test_there_is_a_limit_for_each_input_file_type_and_one_for_an_output_zip():
    assert {spec.url: spec.max_upload_bytes for spec in upload_file_types()} == {
        "/baseline/pjnz": 400 * MB,
        "/baseline/shape": 100 * MB,
        "/baseline/population": 150 * MB,
        "/disease/survey": 50 * MB,
        "/disease/programme": 20 * MB,
        "/disease/anc": 10 * MB,
        "/rehydrate/zip": 500 * MB,
    }


def test_each_input_file_type_has_the_resource_type_that_adr_gives_it():
    assert {spec.file_type: spec.adr_resource_type for spec in INPUT_FILE_TYPES.values()} == {
        FileType.PJNZ: "inputs-unaids-spectrum-file",
        FileType.SHAPE: "inputs-unaids-geographic",
        FileType.POPULATION: "inputs-unaids-population",
        FileType.SURVEY: "inputs-unaids-survey",
        FileType.PROGRAMME: "inputs-unaids-art",
        FileType.ANC: "inputs-unaids-anc",
    }


def test_each_output_has_its_name_and_the_resource_type_that_adr_gives_it():
    assert {spec.key: spec.adr_resource_type for spec in OUTPUT_FILE_TYPES} == {
        "outputZip": "inputs-unaids-naomi-output-zip",
        "outputSummary": "inputs-unaids-naomi-report",
        "outputComparison": "inputs-unaids-naomi-comparison-report",
    }
    assert OUTPUT_ZIP in OUTPUT_FILE_TYPES


def test_an_input_file_type_is_found_by_its_resource_type_on_adr():
    assert input_file_type_on_adr("inputs-unaids-art") == INPUT_FILE_TYPES[FileType.PROGRAMME]
    assert input_file_type_on_adr("inputs-unaids-naomi-output-zip") is None
    assert input_file_type_on_adr("") is None


def test_an_output_is_known_by_its_resource_type_on_adr():
    assert is_output_on_adr("inputs-unaids-naomi-report")
    assert not is_output_on_adr("inputs-unaids-art")
    assert not is_output_on_adr("")
