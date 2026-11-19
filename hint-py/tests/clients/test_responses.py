"""`HintResponse`, the answer in the format of this API that both clients return."""

import json

import pytest

from app.clients.responses import HintResponse
from tests.hintr import SUCCESS


def test_an_envelope_is_sent_as_json_with_its_status():
    response = HintResponse(404, {"data": {}}).response()

    assert response.status_code == 404
    assert response.headers["content-type"] == "application/json"
    assert json.loads(bytes(response.body)) == {"data": {}}


def test_the_text_of_an_envelope_is_sent_byte_for_byte():
    response = HintResponse(201, SUCCESS).response()

    assert response.status_code == 201
    assert response.headers["content-type"] == "application/json"
    assert response.body == SUCCESS


@pytest.mark.parametrize("body", [{"data": {"id": "t1"}}, SUCCESS])
def test_the_data_is_read_from_a_dict_or_from_text(body):
    assert HintResponse(200, body).data == {"id": "t1"}


@pytest.mark.parametrize(("status", "ok"), [(200, True), (302, True), (400, False), (500, False)])
def test_an_answer_is_ok_if_its_status_is_not_an_error(status, ok):
    assert HintResponse(status, {}).ok is ok


def test_a_success_from_json_text_has_the_text_as_its_data():
    answer = HintResponse.success_from_json(b'[{"a":1}]')

    assert answer.body == b'{"data":[{"a":1}],"errors":[],"status":"success"}'
    assert answer.envelope == HintResponse.success([{"a": 1}]).envelope
