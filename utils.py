def check_date_format(date_string: str) -> bool:
    if not (
        len(date_string) == 20
        and date_string.endswith("Z")
        and date_string[4] == "-"
        and date_string[7] == "-"
        and date_string[10] == "T"
        and date_string[13] == ":"
        and date_string[16] == ":"
    ):
        return False
    return True
