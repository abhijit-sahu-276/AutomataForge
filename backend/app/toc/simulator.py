from typing import List
from ..models.dfa_models import DFAModel, SimulationStep, SimulationResult
from .dfa import DFAValidator

class DFASimulator:
    @staticmethod
    def simulate(dfa: DFAModel, input_str: str) -> SimulationResult:
        # Validate first
        val = DFAValidator.validate(dfa)
        if not val.is_valid:
            raise ValueError(f"Cannot simulate invalid DFA: {'; '.join(val.errors)}")

        # Clean string: handle 'ε' as empty string
        cleaned_str = input_str
        if input_str.strip() == "ε" or input_str == "":
            cleaned_str = ""

        # Validate that all symbols belong to the alphabet
        for i, char in enumerate(cleaned_str):
            if char not in dfa.alphabet:
                raise ValueError(
                    f"Symbol '{char}' at index {i} is not in the DFA alphabet {dfa.alphabet}."
                )

        current_state = dfa.start_state
        path: List[str] = [current_state]
        steps: List[SimulationStep] = []

        # Empty string case
        if cleaned_str == "":
            is_accepted = current_state in dfa.accept_states
            return SimulationResult(
                accepted=is_accepted,
                input_string="ε",
                path=path,
                steps=[],
                final_state=current_state,
                is_empty_string=True,
            )

        for step_idx, char in enumerate(cleaned_str):
            next_state = dfa.transitions[current_state][char]
            is_accepting = next_state in dfa.accept_states

            steps.append(
                SimulationStep(
                    step_index=step_idx + 1,
                    from_state=current_state,
                    symbol=char,
                    to_state=next_state,
                    is_accepting=is_accepting,
                )
            )

            current_state = next_state
            path.append(current_state)

        is_accepted = current_state in dfa.accept_states

        return SimulationResult(
            accepted=is_accepted,
            input_string=cleaned_str,
            path=path,
            steps=steps,
            final_state=current_state,
            is_empty_string=False,
        )

