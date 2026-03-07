"""Mapowanie snippet → offset w full_text."""

from app.schemas import MiejsceOffset


def find_snippet_offset(
    full_text: str,
    snippet: str,
    start_from: int = 0,
    end_before: int | None = None,
) -> MiejsceOffset | None:
    """
    Szuka literalnego wystąpienia snippet w full_text (w zakresie [start_from, end_before)).
    Zwraca MiejsceOffset(start, end, snippet) lub None gdy nie znaleziono.
    """
    if not snippet or not full_text:
        return None
    if end_before is None:
        end_before = len(full_text)
    search_slice = full_text[start_from:end_before]
    snippet_clean = " ".join(snippet.split())
    idx = search_slice.find(snippet_clean)
    if idx == -1:
        idx = search_slice.find(snippet)
    if idx == -1:
        first_word = snippet.split()[0] if snippet.split() else snippet[:20]
        idx = search_slice.find(first_word)
        if idx != -1:
            end = min(idx + len(snippet_clean), len(search_slice))
            return MiejsceOffset(
                start=start_from + idx,
                end=start_from + end,
                snippet=snippet_clean or snippet,
            )
        return None
    start = start_from + idx
    end = start + len(snippet_clean)
    return MiejsceOffset(start=start, end=end, snippet=snippet_clean)
