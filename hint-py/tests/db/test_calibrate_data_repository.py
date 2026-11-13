import json

import pytest

from app.db.calibrate_data_repository import read_filtered_calibrate_data
from app.schemas import FilterQuery
from tests.results import ROWS, write_results_database


@pytest.fixture
def results(tmp_path):
    return write_results_database(tmp_path / "plot_data.duckdb")


def read(results, **filters) -> list[dict]:
    return json.loads(read_filtered_calibrate_data(results, FilterQuery(**filters)))


def ids(rows) -> list[tuple]:
    """Enough of each row to tell which it is. The rows come back in no particular order."""
    return sorted((r["indicator"], r["calendar_quarter"], r["sex"], r["area_id"]) for r in rows)


def test_no_filters_gives_every_row_with_only_the_columns_that_are_sent(results):
    rows = read(results)

    assert len(rows) == len(ROWS)
    assert set(rows[0]) == {
        "indicator",
        "calendar_quarter",
        "age_group",
        "sex",
        "area_id",
        "mode",
        "mean",
        "lower",
        "upper",
        "area_level",
    }


@pytest.mark.parametrize(
    ("filters", "expected"),
    [
        ({"indicator": ["plhiv"]}, [("plhiv", "CY2020Q3", "both", "MWI")]),
        ({"calendar_quarter": ["CY2021Q4"]}, [("prevalence", "CY2021Q4", "female", "MWI_1_1")]),
        (
            {"age_group": ["Y015_049"], "indicator": ["prevalence"]},
            [("prevalence", "CY2020Q3", "female", "MWI"), ("prevalence", "CY2020Q3", "male", "MWI_1")],
        ),
        ({"sex": ["both"]}, [("plhiv", "CY2020Q3", "both", "MWI")]),
        ({"area_id": ["MWI_1"]}, [("prevalence", "CY2020Q3", "male", "MWI_1")]),
        ({"area_level": [2]}, [("prevalence", "CY2021Q4", "female", "MWI_1_1")]),
    ],
    ids=["indicator", "quarter", "age group", "sex", "area", "area level"],
)
def test_each_filter(results, filters, expected):
    assert ids(read(results, **filters)) == expected


def test_a_filter_with_several_values_matches_any_of_them(results):
    rows = read(results, indicator=["plhiv"], area_level=[0, 2], calendar_quarter=["CY2020Q3", "CY2021Q4"])
    assert ids(rows) == [("plhiv", "CY2020Q3", "both", "MWI")]
    rows = read(results, area_level=[1, 2])
    assert ids(rows) == [("prevalence", "CY2020Q3", "male", "MWI_1"), ("prevalence", "CY2021Q4", "female", "MWI_1_1")]


def test_a_row_must_match_every_filter(results):
    assert read(results, indicator=["plhiv"], sex=["female"]) == []


def test_every_filter_at_once(results):
    rows = read(
        results,
        indicator=["prevalence"],
        calendar_quarter=["CY2020Q3"],
        age_group=["Y015_049"],
        sex=["female"],
        area_id=["MWI"],
        area_level=[0],
    )
    assert ids(rows) == [("prevalence", "CY2020Q3", "female", "MWI")]
    # And changing any one of them leaves nothing
    assert (
        read(
            results,
            indicator=["prevalence"],
            calendar_quarter=["CY2021Q4"],
            age_group=["Y015_049"],
            sex=["female"],
            area_id=["MWI"],
            area_level=[0],
        )
        == []
    )


@pytest.mark.parametrize("name", ["indicator", "calendar_quarter", "age_group", "sex", "area_id", "area_level"])
def test_an_empty_list_matches_nothing(results, name):
    assert read(results, **{name: []}) == []


def test_values_that_are_not_there_match_nothing(results):
    assert read(results, indicator=["not_an_indicator"]) == []
    assert read(results, area_level=[99]) == []


def test_a_value_is_never_part_of_the_sql(results):
    assert read(results, indicator=["x' OR '1'='1"]) == []
    assert read(results, indicator=["x') OR (1=1"]) == []
    # And the table is still there
    assert len(read(results)) == len(ROWS)


def test_numbers_are_sent_as_the_32_bit_float_they_are_nearest_to(tmp_path):
    """What hintr stores is 64 bit, and the Vue app was always sent the shortest number for the 32 bit float, which is
    about 15% less."""
    rows = [("prevalence", "CY2020Q3", "Y015_049", "both", "MWI", 0.08465529537444219, 0.1, 0.5555, 1.0, 0)]
    results = write_results_database(tmp_path / "plot_data.duckdb", rows)

    text = read_filtered_calibrate_data(results, FilterQuery())

    assert '"mode":0.08465529,"mean":0.1,"lower":0.5555,"upper":1.0,"area_level":0' in text


@pytest.mark.parametrize("number_type", ["DOUBLE", "FLOAT"])
def test_numbers_are_the_same_whether_they_are_stored_as_64_or_32_bit_floats(tmp_path, number_type):
    results = write_results_database(tmp_path / "plot_data.duckdb", number_type=number_type)
    text = read_filtered_calibrate_data(results, FilterQuery(indicator=["prevalence"], area_level=[0]))
    assert '"mode":0.1111,"mean":0.5555,"lower":0.2222,"upper":0.9999,"area_level":0' in text


def test_a_big_number_stays_whole(results):
    (row,) = read(results, indicator=["plhiv"])
    assert (row["mode"], row["mean"], row["lower"], row["upper"]) == (21577142.0, 21577144.0, 21577140.0, 21577146.0)


def test_a_null_number_is_null(tmp_path):
    results = write_results_database(
        tmp_path / "plot_data.duckdb", [("prevalence", "CY2020Q3", "Y015_049", "both", "MWI", None, 0.5, 0.4, 0.6, 0)]
    )
    (row,) = read(results)
    assert row["mode"] is None
    assert row["mean"] == 0.5


def test_a_database_with_no_rows_gives_an_empty_array(tmp_path):
    results = write_results_database(tmp_path / "plot_data.duckdb", [])
    assert read_filtered_calibrate_data(results, FilterQuery()) == "[]"


def test_the_file_is_only_read(results):
    before = results.read_bytes()
    read(results, indicator=["plhiv"])
    assert results.read_bytes() == before
