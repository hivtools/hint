"""Reading the results database of a calibration (Kotlin: CalibrateDataRepository).

hintr writes the results of a calibration to a DuckDB file, in a table called `data`. It never changes after that, so it
is opened read only, and for one query.
"""

from pathlib import Path

import duckdb

from app.schemas import FilterQuery


def _float32(column: str) -> str:
    """The SQL for a number column, as the shortest decimal for the nearest 32 bit float: 0.08465529 for 0.08465529537444219.

    hintr stores the numbers as 64 bit floats (DOUBLE). Kotlin read them as 32 bit ones, so the Vue app has always been
    sent the short form. It is about 15% fewer bytes for the same rows, so it is kept.

    Each cast has a job:

    - `AS FLOAT` rounds to 32 bit precision.
    - `AS VARCHAR` writes that float as its shortest decimal text, '0.08465529'. This is why the FLOAT comes first: the
      shortest text that is exactly a DOUBLE is all of its digits.
    - `AS DOUBLE` makes the text a number again, so that json_object writes a JSON number and not a quoted string.
      The digits stay as they are: '0.08465529' is read as the 64 bit float nearest to it, which is written as 0.08465529.

    Leaving out the last two does not work. DuckDB's JSON writer turns a FLOAT into the 64 bit float of the same value
    before it writes it, so `json_object('mean', CAST(mean AS FLOAT))` gives 0.0846552923321724, which has nearly as
    many digits as the original.

    The other ways were measured on a real results file (350,244 rows, no filter, DuckDB 2.0). Writing the numbers
    makes no difference to the speed of the query, which takes about 0.5 s whichever is used, except for the first:

    - `json(CAST(CAST(x AS FLOAT) AS VARCHAR))` gives the same output, with one cast fewer, but is 15 to 30% slower
      (588 ms against 488 ms).
    - The column as it is (DOUBLE), or `CAST(x AS FLOAT)` (`REAL` is the same type): 85.0 and 83.9 MB, against 73.0 MB
      for this, and 16.3 and 14.2 MB when gzipped, against 9.9 MB.
    - `round(x, 8)`, `round(x, 6)` and `CAST(x AS DECIMAL(18, 9))` change the numbers the Vue app is sent, and do not
      give less than this when gzipped (11.8, 10.3 and 12.6 MB): rounding to 8 places writes 1.5e-9 as 0.0, and 9 places
      writes it as 2e-9. Only `round(x, 4)` is smaller (8.5 MB gzipped), by dropping digits the plots may use.
    """
    return f"CAST(CAST(CAST({column} AS FLOAT) AS VARCHAR) AS DOUBLE)"


# One row of the answer, with the columns in the order that the Vue app was always sent them
_ROW = f"""json_object(
    'indicator', indicator,
    'calendar_quarter', calendar_quarter,
    'age_group', age_group,
    'sex', sex,
    'area_id', area_id,
    'mode', {_float32("mode")},
    'mean', {_float32("mean")},
    'lower', {_float32("lower")},
    'upper', {_float32("upper")},
    'area_level', area_level
)"""


def read_filtered_calibrate_data(path: Path, filter_query: FilterQuery) -> str:
    """The rows that match every filter that is set, as the text of a JSON array. They are not in any order.

    DuckDB writes the JSON itself, which is much quicker than making an object for each of the (up to hundreds of
    thousands of) rows to write it from Python. The call waits for the query, so run it in a thread.
    """
    conditions = []
    parameters = []
    # The fields of `FilterQuery` are the names of the columns to filter on. They come from the model, never from the
    # request, so they are safe to put in the SQL text. The values to look for are always parameters.
    for column, values in filter_query:
        if values is not None:
            # Nothing matches an empty list, so there are no rows
            conditions.append(f"{column} = ANY(?)")
            parameters.append(values)
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    # json_group_array collects the row of each match into one array, but gives null, not [], when there are no matches
    query = f"SELECT coalesce(json_group_array({_ROW}), '[]') FROM data {where}"  # noqa: S608
    with duckdb.connect(str(path), read_only=True) as connection:
        return connection.execute(query, parameters).fetchall()[0][0]
