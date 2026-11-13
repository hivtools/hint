from app.config import Settings
from app.db.database import create_engine


def test_the_values_of_a_statement_are_hidden_in_the_message_of_a_database_error():
    # Without this the message has the values, for example the email of a user, and the message goes to the log
    engine = create_engine(Settings())
    assert engine.sync_engine.hide_parameters is True
