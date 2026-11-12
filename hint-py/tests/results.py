"""Results written the way hintr writes them, for the tests of what reads them."""

from pathlib import Path

import duckdb

# indicator, calendar_quarter, age_group, sex, area_id, mode, mean, lower, upper, area_level
ROWS = [
    ("prevalence", "CY2020Q3", "Y015_049", "female", "MWI", 0.1111, 0.5555, 0.2222, 0.9999, 0),
    ("prevalence", "CY2020Q3", "Y015_049", "male", "MWI_1", 0.1, 0.2, 0.3, 0.4, 1),
    ("prevalence", "CY2021Q4", "Y050_054", "female", "MWI_1_1", 0.5, 0.6, 0.7, 0.8, 2),
    ("plhiv", "CY2020Q3", "Y015_049", "both", "MWI", 21577142.0, 21577144.0, 21577140.0, 21577146.0, 0),
]


def write_results_database(path: Path, rows=ROWS, number_type: str = "DOUBLE") -> Path:
    """A results database like the one of a calibration. hintr stores the numbers as DOUBLE, and an older fixture of
    the Kotlin tests has FLOAT (32 bit, so a whole number over 16777216 is exact only if it is even).

    It has the columns hintr writes, in its order, which are more than are sent, so that a test fails if a column is
    taken by its position or one that should not be sent is.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    with duckdb.connect(str(path)) as connection:
        connection.execute(
            f"""CREATE TABLE data (
                area_level INTEGER, area_level_label VARCHAR, area_id VARCHAR, area_name VARCHAR, sex VARCHAR,
                age_group VARCHAR, age_group_label VARCHAR, calendar_quarter VARCHAR, quarter_label VARCHAR,
                indicator VARCHAR, indicator_label VARCHAR, mean {number_type}, se {number_type},
                median {number_type}, mode {number_type}, lower {number_type}, upper {number_type})"""
        )
        if rows:
            connection.executemany(
                """INSERT INTO data (indicator, calendar_quarter, age_group, sex, area_id, mode, mean, lower, upper,
                    area_level, area_level_label, area_name, age_group_label, quarter_label, indicator_label, se, median)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Level', 'Area name', 'Age label', 'Quarter label',
                    'Indicator label', 0.01, 0.02)""",
                rows,
            )
    return path
