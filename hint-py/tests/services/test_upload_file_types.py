from app.services.upload_file_types import upload_file_types
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
