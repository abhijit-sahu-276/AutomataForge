from typing import Tuple, List, Dict, Set, Optional
from collections import deque
from ..models.dfa_models import DFAModel, EquivalenceResult, SimulationStep
from .dfa import DFAValidator
from .simulator import DFASimulator

class DFAEquivalenceChecker:
    @staticmethod
    def check_equivalence(dfa_a: DFAModel, dfa_b: DFAModel) -> EquivalenceResult:
        # 1. Validate both DFAs
        val_a = DFAValidator.validate(dfa_a)
        if not val_a.is_valid:
            return EquivalenceResult(
                is_equivalent=False,
                message=f"DFA A is invalid: {'; '.join(val_a.errors)}"
            )

        val_b = DFAValidator.validate(dfa_b)
        if not val_b.is_valid:
            return EquivalenceResult(
                is_equivalent=False,
                message=f"DFA B is invalid: {'; '.join(val_b.errors)}"
            )

        # 2. Check alphabets
        alphabet_a = set(dfa_a.alphabet)
        alphabet_b = set(dfa_b.alphabet)
        if alphabet_a != alphabet_b:
            sym_diff = alphabet_a.symmetric_difference(alphabet_b)
            return EquivalenceResult(
                is_equivalent=False,
                counterexample=sorted(list(sym_diff))[0],
                message=f"DFAs operate over different alphabets. Difference: {list(sym_diff)}"
            )

        alphabet = sorted(list(alphabet_a))
        accept_a = set(dfa_a.accept_states)
        accept_b = set(dfa_b.accept_states)

        start_pair = (dfa_a.start_state, dfa_b.start_state)

        # Helper to check if a pair is distinguishing
        def is_distinguishing(p: str, q: str) -> bool:
            return (p in accept_a) != (q in accept_b)

        # Special check for empty string ε (length 0) at start pair
        if is_distinguishing(start_pair[0], start_pair[1]):
            # Start states differ in acceptance status! Shortest counterexample is empty string "" (ε)
            sim_a = DFASimulator.simulate(dfa_a, "")
            sim_b = DFASimulator.simulate(dfa_b, "")
            return EquivalenceResult(
                is_equivalent=False,
                counterexample="ε",
                dfa_a_accepted=sim_a.accepted,
                dfa_b_accepted=sim_b.accepted,
                dfa_a_path=sim_a.path,
                dfa_b_path=sim_b.path,
                dfa_a_steps=sim_a.steps,
                dfa_b_steps=sim_b.steps,
                product_path=[start_pair],
                distinguishing_state=start_pair,
                message=f"DFAs are NOT equivalent. The empty string ε distinguishes them: DFA A {'accepts' if sim_a.accepted else 'rejects'} ε while DFA B {'accepts' if sim_b.accepted else 'rejects'} ε."
            )

        # BFS Queue: stores (current_pair, path_symbols, product_state_path)
        # Predecessor map for reconstructing path: pair -> (parent_pair, symbol)
        queue = deque([start_pair])
        visited: Set[Tuple[str, str]] = {start_pair}
        parent_map: Dict[Tuple[str, str], Tuple[Optional[Tuple[str, str]], Optional[str]]] = {
            start_pair: (None, None)
        }

        distinguishing_pair: Optional[Tuple[str, str]] = None

        while queue:
            curr_a, curr_b = queue.popleft()

            if is_distinguishing(curr_a, curr_b):
                distinguishing_pair = (curr_a, curr_b)
                break

            for sym in alphabet:
                next_a = dfa_a.transitions[curr_a][sym]
                next_b = dfa_b.transitions[curr_b][sym]
                next_pair = (next_a, next_b)

                if next_pair not in visited:
                    visited.add(next_pair)
                    parent_map[next_pair] = ((curr_a, curr_b), sym)
                    queue.append(next_pair)

        if distinguishing_pair is not None:
            # Reconstruct shortest counterexample
            symbols_rev: List[str] = []
            product_path_rev: List[Tuple[str, str]] = [distinguishing_pair]
            curr = distinguishing_pair

            while True:
                parent, sym = parent_map[curr]
                if parent is None or sym is None:
                    break
                symbols_rev.append(sym)
                product_path_rev.append(parent)
                curr = parent

            counterexample_symbols = list(reversed(symbols_rev))
            counterexample = "".join(counterexample_symbols)
            product_path = list(reversed(product_path_rev))

            # Simulate both on the counterexample for detailed verification & trace
            sim_a = DFASimulator.simulate(dfa_a, counterexample)
            sim_b = DFASimulator.simulate(dfa_b, counterexample)

            ce_display = counterexample if counterexample != "" else "ε"
            return EquivalenceResult(
                is_equivalent=False,
                counterexample=ce_display,
                dfa_a_accepted=sim_a.accepted,
                dfa_b_accepted=sim_b.accepted,
                dfa_a_path=sim_a.path,
                dfa_b_path=sim_b.path,
                dfa_a_steps=sim_a.steps,
                dfa_b_steps=sim_b.steps,
                product_path=product_path,
                distinguishing_state=distinguishing_pair,
                message=f"DFAs are NOT equivalent! Distinguishing counterexample found: '{ce_display}'. DFA A {'accepts' if sim_a.accepted else 'rejects'} it (ends at {sim_a.final_state}), but DFA B {'accepts' if sim_b.accepted else 'rejects'} it (ends at {sim_b.final_state})."
            )

        # No distinguishing state found in the entire reachable product space
        return EquivalenceResult(
            is_equivalent=True,
            counterexample=None,
            dfa_a_accepted=None,
            dfa_b_accepted=None,
            dfa_a_path=[],
            dfa_b_path=[],
            dfa_a_steps=[],
            dfa_b_steps=[],
            product_path=[],
            distinguishing_state=None,
            message="Both DFAs are formally EQUIVALENT. The product automaton BFS explored all reachable state pairs, and no distinguishing state exists (both automata agree on acceptance for every reachable configuration)."
        )

