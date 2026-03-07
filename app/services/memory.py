"""Pamięć kontekstu na czas jednego żądania – podsumowania dla agentów JEZYK i GRAF."""

from dataclasses import dataclass, field


@dataclass
class ContextMemory:
    """Stan kontekstu: osobne podsumowania dla agenta języka i agenta grafów."""

    summary_jezyk: str = field(default_factory=str)
    summary_graf: str = field(default_factory=str)

    def update_jezyk(self, new_summary: str) -> None:
        self.summary_jezyk = new_summary or self.summary_jezyk

    def update_graf(self, new_summary: str) -> None:
        self.summary_graf = new_summary or self.summary_graf
