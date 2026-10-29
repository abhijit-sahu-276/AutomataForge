from typing import List, Dict, Set, Tuple, Optional
from ..models.dfa_models import DFAModel
from .dfa import DFAValidator
from .minimizer import DFAMinimizer

class PatternCompiler:
    @staticmethod
    def build_ends_with(suffix: str, alphabet: List[str]) -> DFAModel:
        """Constructs DFA that accepts strings ending with `suffix`."""
        m = len(suffix)
        states = [f"q{i}" for i in range(m + 1)]
        start_state = "q0"
        accept_states = [f"q{m}"]
        transitions: Dict[str, Dict[str, str]] = {}

        for i in range(m + 1):
            curr_state = f"q{i}"
            transitions[curr_state] = {}
            prefix_so_far = suffix[:i]
            for sym in alphabet:
                candidate = prefix_so_far + sym
                # Find longest proper prefix of suffix that is suffix of candidate
                k = min(m, len(candidate))
                while k > 0:
                    if candidate.endswith(suffix[:k]):
                        break
                    k -= 1
                transitions[curr_state][sym] = f"q{k}"

        dfa = DFAModel(
            states=states,
            alphabet=alphabet,
            start_state=start_state,
            accept_states=accept_states,
            transitions=transitions
        )
        return DFAMinimizer.minimize(dfa).minimized_dfa

    @staticmethod
    def build_contains(substring: str, alphabet: List[str]) -> DFAModel:
        """Constructs DFA that accepts strings containing `substring`."""
        m = len(substring)
        states = [f"q{i}" for i in range(m + 1)]
        start_state = "q0"
        accept_states = [f"q{m}"]
        transitions: Dict[str, Dict[str, str]] = {}

        for i in range(m):
            curr_state = f"q{i}"
            transitions[curr_state] = {}
            prefix_so_far = substring[:i]
            for sym in alphabet:
                candidate = prefix_so_far + sym
                k = min(m, len(candidate))
                while k > 0:
                    if candidate.endswith(substring[:k]):
                        break
                    k -= 1
                transitions[curr_state][sym] = f"q{k}"

        # Absorbing state qm
        transitions[f"q{m}"] = {sym: f"q{m}" for sym in alphabet}

        dfa = DFAModel(
            states=states,
            alphabet=alphabet,
            start_state=start_state,
            accept_states=accept_states,
            transitions=transitions
        )
        return DFAMinimizer.minimize(dfa).minimized_dfa

    @staticmethod
    def build_avoids(substring: str, alphabet: List[str]) -> DFAModel:
        """Constructs DFA that accepts strings that DO NOT contain `substring`."""
        contains_dfa = PatternCompiler.build_contains(substring, alphabet)
        # Invert accept states
        all_states = set(contains_dfa.states)
        new_accept = sorted(list(all_states - set(contains_dfa.accept_states)))
        dfa = DFAModel(
            states=contains_dfa.states,
            alphabet=contains_dfa.alphabet,
            start_state=contains_dfa.start_state,
            accept_states=new_accept,
            transitions=contains_dfa.transitions
        )
        return DFAMinimizer.minimize(dfa).minimized_dfa

    @staticmethod
    def build_starts_with(prefix: str, alphabet: List[str]) -> DFAModel:
        """Constructs DFA that accepts strings starting with `prefix`."""
        m = len(prefix)
        states = [f"q{i}" for i in range(m + 1)] + ["q_trap"]
        start_state = "q0"
        accept_states = [f"q{m}"]
        transitions: Dict[str, Dict[str, str]] = {}

        for i in range(m):
            curr_state = f"q{i}"
            transitions[curr_state] = {}
            for sym in alphabet:
                if sym == prefix[i]:
                    transitions[curr_state][sym] = f"q{i+1}"
                else:
                    transitions[curr_state][sym] = "q_trap"

        # Matching completed state qm loops to itself on any symbol
        transitions[f"q{m}"] = {sym: f"q{m}" for sym in alphabet}
        # Trap state loops on everything
        transitions["q_trap"] = {sym: "q_trap" for sym in alphabet}

        dfa = DFAModel(
            states=states,
            alphabet=alphabet,
            start_state=start_state,
            accept_states=accept_states,
            transitions=transitions
        )
        return DFAMinimizer.minimize(dfa).minimized_dfa

    @staticmethod
    def build_modulo_count(symbol: str, modulus: int, remainder: int, alphabet: List[str]) -> DFAModel:
        """Constructs DFA where count(symbol) % modulus == remainder."""
        states = [f"q{i}" for i in range(modulus)]
        start_state = "q0"
        accept_states = [f"q{remainder}"]
        transitions: Dict[str, Dict[str, str]] = {}

        for i in range(modulus):
            curr = f"q{i}"
            transitions[curr] = {}
            for sym in alphabet:
                if sym == symbol:
                    next_idx = (i + 1) % modulus
                    transitions[curr][sym] = f"q{next_idx}"
                else:
                    transitions[curr][sym] = curr

        dfa = DFAModel(
            states=states,
            alphabet=alphabet,
            start_state=start_state,
            accept_states=accept_states,
            transitions=transitions
        )
        return DFAMinimizer.minimize(dfa).minimized_dfa

    @staticmethod
    def intersect_dfas(dfa_a: DFAModel, dfa_b: DFAModel) -> DFAModel:
        """Builds intersection DFA via Cartesian product construction."""
        alphabet = sorted(list(set(dfa_a.alphabet).intersection(set(dfa_b.alphabet))))
        start_pair = f"{dfa_a.start_state}_{dfa_b.start_state}"
        
        visited: Set[Tuple[str, str]] = set()
        queue = [(dfa_a.start_state, dfa_b.start_state)]
        visited.add((dfa_a.start_state, dfa_b.start_state))

        states: List[str] = []
        accept_states: List[str] = []
        transitions: Dict[str, Dict[str, str]] = {}

        accept_a = set(dfa_a.accept_states)
        accept_b = set(dfa_b.accept_states)

        while queue:
            sa, sb = queue.pop(0)
            pair_name = f"{sa}_{sb}"
            states.append(pair_name)
            if sa in accept_a and sb in accept_b:
                accept_states.append(pair_name)

            transitions[pair_name] = {}
            for sym in alphabet:
                na = dfa_a.transitions[sa][sym]
                nb = dfa_b.transitions[sb][sym]
                nxt_pair = (na, nb)
                nxt_name = f"{na}_{nb}"
                transitions[pair_name][sym] = nxt_name
                if nxt_pair not in visited:
                    visited.add(nxt_pair)
                    queue.append(nxt_pair)

        raw_dfa = DFAModel(
            states=states,
            alphabet=alphabet,
            start_state=start_pair,
            accept_states=accept_states,
            transitions=transitions
        )
        return DFAMinimizer.minimize(raw_dfa).minimized_dfa

    @staticmethod
    def compile_from_spec(spec: dict) -> Tuple[Optional[DFAModel], str]:
        """Compiles a validated specification dictionary into a DFA."""
        pattern_type = spec.get("pattern_type", "").lower()
        alphabet = spec.get("alphabet", ["0", "1"])
        params = spec.get("parameters", {})

        try:
            if pattern_type == "ends_with":
                suffix = str(params.get("suffix", "01"))
                dfa = PatternCompiler.build_ends_with(suffix, alphabet)
                return dfa, f"Constructed DFA accepting strings ending with '{suffix}'."

            elif pattern_type == "contains":
                sub = str(params.get("substring", "101"))
                dfa = PatternCompiler.build_contains(sub, alphabet)
                return dfa, f"Constructed DFA accepting strings containing substring '{sub}'."

            elif pattern_type == "avoids":
                sub = str(params.get("substring", "00"))
                dfa = PatternCompiler.build_avoids(sub, alphabet)
                return dfa, f"Constructed DFA accepting strings avoiding substring '{sub}'."

            elif pattern_type == "starts_with":
                pre = str(params.get("prefix", "1"))
                dfa = PatternCompiler.build_starts_with(pre, alphabet)
                return dfa, f"Constructed DFA accepting strings starting with '{pre}'."

            elif pattern_type in ["even_count", "odd_count", "modulo_count"]:
                symbol = str(params.get("symbol", alphabet[0]))
                modulus = int(params.get("modulus", 2))
                rem = int(params.get("remainder", 0 if pattern_type == "even_count" else 1))
                dfa = PatternCompiler.build_modulo_count(symbol, modulus, rem, alphabet)
                parity_label = "even" if rem == 0 and modulus == 2 else ("odd" if rem == 1 and modulus == 2 else f"mod {modulus} == {rem}")
                return dfa, f"Constructed DFA enforcing {parity_label} count of symbol '{symbol}'."

            elif pattern_type == "even_zeros_and_ends_with_one" or pattern_type == "composite_even_and_ends_with":
                symbol = str(params.get("symbol", "0"))
                suffix = str(params.get("suffix", "1"))
                dfa1 = PatternCompiler.build_modulo_count(symbol, 2, 0, alphabet)
                dfa2 = PatternCompiler.build_ends_with(suffix, alphabet)
                comp = PatternCompiler.intersect_dfas(dfa1, dfa2)
                return comp, f"Constructed composite DFA accepting strings with even count of '{symbol}' AND ending in '{suffix}'."

            elif pattern_type == "composite_intersection":
                conditions = params.get("conditions", [])
                if not conditions:
                    return None, "No sub-conditions provided for intersection."
                # Compile each sub-spec and intersect
                current_dfa: Optional[DFAModel] = None
                for sub_spec in conditions:
                    sub_dfa, _ = PatternCompiler.compile_from_spec(sub_spec)
                    if sub_dfa is None:
                        return None, f"Failed compiling subcondition: {sub_spec}"
                    if current_dfa is None:
                        current_dfa = sub_dfa
                    else:
                        current_dfa = PatternCompiler.intersect_dfas(current_dfa, sub_dfa)
                return current_dfa, "Constructed composite intersected DFA."

            else:
                return None, f"Pattern type '{pattern_type}' is not supported by the deterministic compiler template."

        except Exception as e:
            return None, f"Compilation error: {str(e)}"

