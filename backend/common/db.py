def schema_table(schema: str, table: str) -> str:
    """Schema-qualified, quoted table name for Meta.db_table.

    Postgres schema names like "group" collide with reserved words, and every
    table in this project lives in a named schema (not the default `public`)
    per the database/*.sql design docs — always quote both parts.
    """
    return f'"{schema}"."{table}"'
