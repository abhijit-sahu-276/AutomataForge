from typing import List, Dict, Set, Tuple
from ..models.dfa_models import DFAModel, ValidationResult

MAX_STATES = 50
MAX_ALPHABET = 10

class DFAValidator:
    @staticmethod
    def validate(dfa: DFAModel) -> ValidationResult:
        errors: List[str] = []
        warnings: List[str] = []

        # 1. State checks
        if not dfa.states:
            errors.append("States set cannot be empty.")
            return ValidationResult(is_valid=False, errors=errors)

        if len(dfa.states) > MAX_STATES:
            errors.append(f"DFA exceeds maximum state limit ({MAX_STATES} states allowed).")

        unique_states = set(dfa.states)
        if len(unique_states) != len(dfa.states):
            errors.append("States list contains duplicate state names.")

        # 2. Alphabet checks
        if not dfa.alphabet:
            errors.append("Alphabet cannot be empty.")
            return ValidationResult(is_valid=False, errors=errors)

        if len(dfa.alphabet) > MAX_ALPHABET:
            errors.append(f"Alphabet exceeds maximum size ({MAX_ALPHABET} symbols allowed).")

        unique_alphabet = set(dfa.alphabet)
        if len(unique_alphabet) != len(dfa.alphabet):
            errors.append("Alphabet contains duplicate symbols.")

        for symbol in dfa.alphabet:
            if symbol == "ε" or symbol == "":
                errors.append("Empty string 'ε' or empty character cannot be part of the DFA input alphabet.")
            if len(symbol) != 1:
                warnings.append(f"Alphabet symbol '{symbol}' has length > 1; single character symbols are recommended.")

        # 3. Start state check
        if dfa.start_state not in unique_states:
            errors.append(f"Start state '{dfa.start_state}' is not defined in the set of states {list(unique_states)}.")

        # 4. Accept states check
        accept_set = set(dfa.accept_states)
        for acc in dfa.accept_states:
            if acc not in unique_states:
                errors.append(f"Accept state '{acc}' is not present in the set of states.")

        # 5. Transition completeness & validity
        if not isinstance(dfa.transitions, dict):
            errors.append("Transitions must be a dictionary mapping states to symbol transitions.")
            return ValidationResult(is_valid=False, errors=errors)

        for state in unique_states:
            if state not in dfa.transitions:
                errors.append(f"Missing transition entry for state '{state}'.")
                continue

            state_trans = dfa.transitions[state]
            if not isinstance(state_trans, dict):
                errors.append(f"Transitions for state '{state}' must be a dictionary mapping symbols to target states.")
                continue

            # Check every alphabet symbol has exactly one transition
            for symbol in unique_alphabet:
                if symbol not in state_trans:
                    errors.append(f"State '{state}' lacks a transition for symbol '{symbol}'. Complete DFAs require transitions for all alphabet symbols.")
                else:
                    dest = state_trans[symbol]
                    if dest not in unique_states:
                        errors.append(f"Transition δ({state}, '{symbol}') = '{dest}' points to non-existent state '{dest}'.")

            # Check if any extra transitions exist for symbols not in the alphabet
            for sym in state_trans:
                if sym not in unique_alphabet:
                    errors.append(f"State '{state}' defines transition on symbol '{sym}' which is not in the alphabet {list(unique_alphabet)}.")

        # Extra checks for extra states in transition dictionary
        for st in dfa.transitions:
            if st not in unique_states:
                errors.append(f"Transitions dictionary contains unknown state '{st}'.")

        # Reachability analysis
        reachable = DFAValidator.get_reachable_states(dfa)
        unreachable = sorted(list(unique_states - reachable))
        if unreachable:
            warnings.append(f"Unreachable states detected: {', '.join(unreachable)}. These states cannot be reached from start state '{dfa.start_state}'.")

        # Trap/dead states analysis (non-accepting states from which no accept state can ever be reached)
        trap_states = DFAValidator.get_trap_states(dfa, reachable)

        is_valid = len(errors) == 0
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            unreachable_states=unreachable,
            trap_or_dead_states=trap_states
        )

    @staticmethod
    def get_reachable_states(dfa: DFAModel) -> Set[str]:
        if dfa.start_state not in dfa.states:
            return set()
        visited = set([dfa.start_state])
        queue = [dfa.start_state]

        while queue:
            curr = queue.pop(0)
            transitions = dfa.transitions.get(curr, {})
            for symbol, next_st in transitions.items():
                if symbol in dfa.alphabet and next_st in dfa.states and next_st not in visited:
                    visited.add(next_st)
                    queue.append(next_st)
        return visited

    @staticmethod
    def get_trap_states(dfa: DFAModel, reachable: Set[str]) -> List[str]:
        # A trap state is in reachable, not accepting, and can never reach any accepting state
        accept_set = set(dfa.accept_states)
        can_reach_accept = set(accept_set)
        # Reverse BFS/propagation
        changed = True
        while changed:
            changed = False
            for st in reachable:
                if st not in can_reach_accept:
                    trans = dfa.transitions.get(st, {})
                    for sym, nxt in trans.items():
                        if nxt in can_reach_accept:
                            can_reach_accept.add(st)
                            changed = True
                            break
        
        trap_states = [s for s in reachable if s not in can_reach_accept]
        return sorted(trap_states)

