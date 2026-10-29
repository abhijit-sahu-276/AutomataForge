import os
import json
import re
import httpx
from typing import Dict, Any, Optional, List, Tuple
from ..models.dfa_models import (
    DFAModel,
    LanguageSpecification,
    NaturalLanguageResponse,
    CounterexampleExplainResponse,
    CandidateRepair,
    RepairSuggestionResponse,
)
from ..toc.pattern_compiler import PatternCompiler
from ..toc.equivalence import DFAEquivalenceChecker
from ..toc.dfa import DFAValidator
from ..toc.simulator import DFASimulator

class AIService:
    def __init__(self):
        self.api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.provider = (os.getenv("AI_PROVIDER") or "gemini").lower()
        self.model = os.getenv("AI_MODEL") or ("gemini-2.5-flash" if self.provider == "gemini" else "gpt-4o-mini")
        self.base_url = os.getenv("AI_BASE_URL", "").rstrip("/")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "your_api_key_here")

    def _call_llm(self, system_prompt: str, user_prompt: str, expect_json: bool = True) -> str:
        if not self.is_configured():
            raise ValueError("AI API key is not configured. Please set AI_API_KEY in backend/.env.")

        combined_prompt = f"{system_prompt}\n\nTask:\n{user_prompt}\n\nProvide response strictly as valid JSON if json is requested."

        timeout = httpx.Timeout(20.0, connect=10.0)
        with httpx.Client(timeout=timeout) as client:
            try:
                if self.provider == "gemini":
                    url = self.base_url or "https://generativelanguage.googleapis.com"
                    endpoint = f"{url}/v1beta/models/{self.model}:generateContent?key={self.api_key}"
                    payload = {
                        "contents": [
                            {
                                "role": "user",
                                "parts": [{"text": combined_prompt}]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.1,
                            "responseMimeType": "application/json" if expect_json else "text/plain"
                        }
                    }
                    resp = client.post(endpoint, json=payload)
                    if resp.status_code != 200:
                        raise RuntimeError(f"Gemini API returned status {resp.status_code}: {resp.text}")
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise RuntimeError("Model returned no candidate responses.")
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    if not content_parts:
                        raise RuntimeError("Model candidate has no parts.")
                    return content_parts[0].get("text", "")

                else:
                    # OpenAI compatible
                    url = self.base_url or "https://api.openai.com/v1"
                    endpoint = f"{url}/chat/completions"
                    headers = {
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ]
                    payload = {
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.1
                    }
                    if expect_json:
                        payload["response_format"] = {"type": "json_object"}
                    resp = client.post(endpoint, headers=headers, json=payload)
                    if resp.status_code != 200:
                        raise RuntimeError(f"OpenAI API returned status {resp.status_code}: {resp.text}")
                    data = resp.json()
                    choices = data.get("choices", [])
                    if not choices:
                        raise RuntimeError("OpenAI returned no choices.")
                    return choices[0].get("message", {}).get("content", "")

            except httpx.ConnectTimeout:
                raise RuntimeError("Connection timed out while reaching the AI provider.")
            except httpx.RequestError as e:
                raise RuntimeError(f"Network error contacting AI provider: {str(e)}")

    def _extract_json_block(self, text: str) -> Dict[str, Any]:
        """Safely parses JSON from text, extracting markdown code fences if present."""
        clean = text.strip()
        if "```json" in clean:
            match = re.search(r"```json\s*(.*?)\s*```", clean, re.DOTALL)
            if match:
                clean = match.group(1).strip()
        elif "```" in clean:
            match = re.search(r"```\s*(.*?)\s*```", clean, re.DOTALL)
            if match:
                clean = match.group(1).strip()
        
        try:
            return json.loads(clean)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM output as JSON: {str(e)}. Raw text: {clean[:200]}")

    def interpret_language(self, user_text: str, explicit_alphabet: Optional[List[str]] = None) -> NaturalLanguageResponse:
        """
        Translates natural language to structured specification.
        Then deterministic pattern compiler generates the verified DFA.
        """
        user_lower = user_text.lower().strip()
        spec_dict: Dict[str, Any] = {}

        if self.is_configured():
            system_prompt = (
                "You are AutomataForge's Formal Language Parser. "
                "Your role is to translate natural language regular language specifications into a strict JSON schema. "
                "Supported pattern types: 'ends_with', 'contains', 'avoids', 'starts_with', 'even_count', 'odd_count', 'even_zeros_and_ends_with_one'. "
                "Output JSON with keys: "
                "alphabet (list of single-char symbols), pattern_type (str), parameters (dict with keys like 'suffix', 'substring', 'prefix', 'symbol', 'modulus', 'remainder'), "
                "description (str), conditions (list of str), acceptance_criteria (list of str), assumptions (list of str), "
                "is_supported (bool), clarification_needed (bool), clarification_question (str or null)."
            )
            user_msg = f"User language description: \"{user_text}\"\nExplicit alphabet provided: {explicit_alphabet}"
            try:
                raw_response = self._call_llm(system_prompt, user_msg, expect_json=True)
                spec_dict = self._extract_json_block(raw_response)
            except Exception:
                # If LLM call fails, fall back to rule-based parser
                spec_dict = self._fallback_parse(user_text, explicit_alphabet)
        else:
            # Deterministic TOC fallback parser
            spec_dict = self._fallback_parse(user_text, explicit_alphabet)

        # Validate structured specification
        alphabet = spec_dict.get("alphabet") or explicit_alphabet or ["0", "1"]
        pattern_type = spec_dict.get("pattern_type", "unknown")
        params = spec_dict.get("parameters", {})

        spec = LanguageSpecification(
            alphabet=alphabet,
            pattern_type=pattern_type,
            parameters=params,
            description=spec_dict.get("description", user_text),
            conditions=spec_dict.get("conditions", []),
            acceptance_criteria=spec_dict.get("acceptance_criteria", []),
            assumptions=spec_dict.get("assumptions", []),
            clarification_needed=spec_dict.get("clarification_needed", False),
            clarification_question=spec_dict.get("clarification_question"),
            is_supported=spec_dict.get("is_supported", True)
        )

        if not spec.is_supported:
            return NaturalLanguageResponse(
                specification=spec,
                dfa=None,
                explanation="The described language is outside the currently supported regular pattern subset (e.g. non-regular counting or complex grammars). Please use suffixes, substrings, symbol parities, or simple compositions."
            )

        # Deterministic formal compiler builds and minimizes the DFA
        dfa, compile_msg = PatternCompiler.compile_from_spec(spec.model_dump())
        if dfa is None:
            spec.is_supported = False
            return NaturalLanguageResponse(
                specification=spec,
                dfa=None,
                explanation=f"Compiler limitation: {compile_msg}"
            )

        # Generate sample accepted and rejected strings using the compiled DFA
        sample_acc, sample_rej = self._generate_sample_strings(dfa)

        return NaturalLanguageResponse(
            specification=spec,
            dfa=dfa,
            sample_accepted=sample_acc,
            sample_rejected=sample_rej,
            explanation=compile_msg
        )

    def _fallback_parse(self, text: str, alphabet: Optional[List[str]]) -> Dict[str, Any]:
        """High-precision regex/rule-based parser for supported college TOC regular language patterns."""
        t = text.lower()
        alpha = alphabet or ["0", "1"]
        # Detect alphabet in text if mentioned e.g. "over {a, b}" or "over {0,1}"
        m_alpha = re.search(r"over\s*\{([^}]+)\}", t)
        if m_alpha:
            alpha = [s.strip().replace("'", "").replace('"', '') for s in m_alpha.group(1).split(",")]

        # Pattern 1: even zeros and ends with 1
        if "even" in t and ("zero" in t or "0" in t) and "end" in t and ("1" in t or "one" in t):
            return {
                "alphabet": alpha,
                "pattern_type": "even_zeros_and_ends_with_one",
                "parameters": {"symbol": "0", "suffix": "1"},
                "description": "Strings containing an even number of zeros and ending with 1",
                "conditions": ["Count of 0s is even (mod 2 == 0)", "Last character is '1'"],
                "acceptance_criteria": ["Ends in 1", "Total 0s count is 0, 2, 4, ..."],
                "assumptions": ["Empty string ε has 0 zeros (even), but does not end in 1, so ε is rejected."],
                "is_supported": True
            }

        # Pattern 2: ending with suffix
        m_ends = re.search(r"end(?:ing|s)?\s*(?:with|in)\s*['\"]?([0-9a-zA-Z]+)['\"]?", t)
        if m_ends:
            suffix = m_ends.group(1)
            return {
                "alphabet": alpha,
                "pattern_type": "ends_with",
                "parameters": {"suffix": suffix},
                "description": f"Strings ending with '{suffix}'",
                "conditions": [f"Suffix must be '{suffix}'"],
                "acceptance_criteria": [f"Word ends with {suffix}"],
                "assumptions": [f"Strings shorter than {len(suffix)} cannot end with '{suffix}' unless suffix is empty."],
                "is_supported": True
            }

        # Pattern 3: containing substring
        m_contains = re.search(r"contain(?:ing|s)?\s*(?:substring\s*)?['\"]?([0-9a-zA-Z]+)['\"]?", t)
        if m_contains and "even" not in t and "odd" not in t:
            sub = m_contains.group(1)
            return {
                "alphabet": alpha,
                "pattern_type": "contains",
                "parameters": {"substring": sub},
                "description": f"Strings containing substring '{sub}'",
                "conditions": [f"Substring '{sub}' occurs at least once"],
                "acceptance_criteria": [f"Substring '{sub}' present"],
                "assumptions": ["Once the substring is observed, the automaton stays in accepting state."],
                "is_supported": True
            }

        # Pattern 4: avoiding / not containing substring
        m_avoids = re.search(r"(?:avoid(?:ing|s)?|do(?:es)?\s*not\s*contain)\s*['\"]?([0-9a-zA-Z]+)['\"]?", t)
        if m_avoids:
            sub = m_avoids.group(1)
            return {
                "alphabet": alpha,
                "pattern_type": "avoids",
                "parameters": {"substring": sub},
                "description": f"Strings that do not contain substring '{sub}'",
                "conditions": [f"Substring '{sub}' must never occur"],
                "acceptance_criteria": [f"Does not contain '{sub}'"],
                "assumptions": ["Seeing the forbidden substring leads permanently to a trap state."],
                "is_supported": True
            }

        # Pattern 5: starting with
        m_starts = re.search(r"start(?:ing|s)?\s*(?:with|in)\s*['\"]?([0-9a-zA-Z]+)['\"]?", t)
        if m_starts:
            pre = m_starts.group(1)
            return {
                "alphabet": alpha,
                "pattern_type": "starts_with",
                "parameters": {"prefix": pre},
                "description": f"Strings starting with '{pre}'",
                "conditions": [f"Prefix must match '{pre}'"],
                "acceptance_criteria": [f"Begins with '{pre}'"],
                "assumptions": ["Any mismatch in prefix leads to a non-accepting trap state."],
                "is_supported": True
            }

        # Pattern 6: even or odd count
        if "even" in t:
            sym = "0" if "0" in t or "zero" in t else ("1" if "1" in t or "one" in t else alpha[0])
            return {
                "alphabet": alpha,
                "pattern_type": "even_count",
                "parameters": {"symbol": sym, "modulus": 2, "remainder": 0},
                "description": f"Strings with an even number of '{sym}'s",
                "conditions": [f"Count of '{sym}' is even"],
                "acceptance_criteria": [f"count({sym}) % 2 == 0"],
                "assumptions": ["Empty string ε has 0 occurrences (even), hence accepted."],
                "is_supported": True
            }

        if "odd" in t:
            sym = "1" if "1" in t or "one" in t else ("0" if "0" in t or "zero" in t else alpha[0])
            return {
                "alphabet": alpha,
                "pattern_type": "odd_count",
                "parameters": {"symbol": sym, "modulus": 2, "remainder": 1},
                "description": f"Strings with an odd number of '{sym}'s",
                "conditions": [f"Count of '{sym}' is odd"],
                "acceptance_criteria": [f"count({sym}) % 2 == 1"],
                "assumptions": ["Empty string ε has 0 occurrences (even), hence rejected."],
                "is_supported": True
            }

        # Default fallback: ends with 01
        return {
            "alphabet": alpha,
            "pattern_type": "ends_with",
            "parameters": {"suffix": "01"},
            "description": "Default pattern: strings ending with '01'",
            "conditions": ["Ends with 01"],
            "acceptance_criteria": ["Ends in 01"],
            "assumptions": ["Unrecognized free text defaulted to standard TOC test pattern."],
            "is_supported": True
        }

    def _generate_sample_strings(self, dfa: DFAModel) -> Tuple[List[str], List[str]]:
        accepted: List[str] = []
        rejected: List[str] = []
        alphabet = dfa.alphabet

        candidates = ["", "0", "1", "00", "01", "10", "11", "000", "001", "010", "011", "100", "101", "110", "111", "0101", "1010", "1101"]
        # Filter candidates matching the alphabet
        alpha_set = set(alphabet)

        for s in candidates:
            if not all(c in alpha_set for c in s):
                continue
            res = DFASimulator.simulate(dfa, s)
            label = "ε" if s == "" else s
            if res.accepted and len(accepted) < 4:
                accepted.append(label)
            elif not res.accepted and len(rejected) < 4:
                rejected.append(label)

        return accepted, rejected

    def explain_counterexample(
        self,
        dfa_a: DFAModel,
        dfa_b: DFAModel,
        counterexample: str,
        dfa_a_accepted: bool,
        dfa_b_accepted: bool,
        dfa_a_path: List[str],
        dfa_b_path: List[str],
    ) -> CounterexampleExplainResponse:
        """Explains shortest counterexample found by BFS."""
        ce_display = counterexample if counterexample != "" else "ε"
        divergence_point = f"Final state in DFA A: {dfa_a_path[-1]} ({'Accepting' if dfa_a_accepted else 'Non-accepting'}) vs DFA B: {dfa_b_path[-1]} ({'Accepting' if dfa_b_accepted else 'Non-accepting'})."

        # Check where state transitions start diverging
        first_diff_idx = None
        min_len = min(len(dfa_a_path), len(dfa_b_path))
        for i in range(min_len):
            if dfa_a_path[i] != dfa_b_path[i]:
                first_diff_idx = i
                break

        if self.is_configured():
            system_prompt = (
                "You are an expert Theory of Computation instructor. "
                "Explain why the given counterexample disproves equivalence of the two DFAs. "
                "Base your explanation strictly on the provided state traces and facts. "
                "Return JSON with keys: explanation, key_divergence_point, why_shortest, educational_takeaway."
            )
            user_msg = (
                f"Counterexample string: '{ce_display}'\n"
                f"DFA A Trace: {' -> '.join(dfa_a_path)} | Accepted: {dfa_a_accepted}\n"
                f"DFA B Trace: {' -> '.join(dfa_b_path)} | Accepted: {dfa_b_accepted}\n"
                f"States: DFA A={dfa_a.states}, DFA B={dfa_b.states}\n"
                f"Accept States: DFA A={dfa_a.accept_states}, DFA B={dfa_b.accept_states}"
            )
            try:
                raw = self._call_llm(system_prompt, user_msg, expect_json=True)
                data = self._extract_json_block(raw)
                return CounterexampleExplainResponse(
                    explanation=data.get("explanation", ""),
                    key_divergence_point=data.get("key_divergence_point", divergence_point),
                    why_shortest=data.get("why_shortest", "Breadth-First Search (BFS) explores the product state space layer-by-layer by string length, guaranteeing that the first distinguishing product state reached has minimal length."),
                    educational_takeaway=data.get("educational_takeaway", "Equivalence between DFAs requires complete language agreement across all inputs. A single distinguishing counterexample proves L(A) != L(B).")
                )
            except Exception:
                pass

        # Deterministic formal explanation
        return CounterexampleExplainResponse(
            explanation=(
                f"The string '{ce_display}' disproves equivalence between DFA A and DFA B. "
                f"When processing '{ce_display}', DFA A follows path { ' -> '.join(dfa_a_path) } ending in state '{dfa_a_path[-1]}' ({'ACCEPT' if dfa_a_accepted else 'REJECT'}). "
                f"Meanwhile, DFA B follows path { ' -> '.join(dfa_b_path) } ending in state '{dfa_b_path[-1]}' ({'ACCEPT' if dfa_b_accepted else 'REJECT'}). "
                f"Because exactly one automaton accepts '{ce_display}', the symmetric difference L(A) △ L(B) is non-empty."
            ),
            key_divergence_point=divergence_point,
            why_shortest="BFS explores product automaton states in increasing order of path depth. Therefore, the first distinguishing pair (p, q) with (p ∈ F_A) ≠ (q ∈ F_B) corresponds to a counterexample of minimal length.",
            educational_takeaway="Two DFAs are language-equivalent if and only if no reachable product state (q_A, q_B) has differing acceptance status."
        )

    def suggest_repairs(
        self,
        ref_dfa: DFAModel,
        stu_dfa: DFAModel,
        counterexample: str,
        expected_acc: bool,
        stu_acc: bool,
        ref_path: List[str],
        stu_path: List[str]
    ) -> RepairSuggestionResponse:
        """
        Diagnoses incorrect student DFA and proposes candidate repairs.
        Every candidate repair is tested and formally verified against the reference DFA.
        """
        ce_display = counterexample if counterexample != "" else "ε"
        candidates: List[CandidateRepair] = []

        # Find candidate transitions along student's path that could be modified
        # Strategy: For each state visited on student path, consider changing outgoing transition for the symbol
        # or flipping acceptance status if length is 0 (ε distinguishes).
        
        # Candidate 0: If counterexample is ε, the bug is simply the start state acceptance status!
        if ce_display == "ε":
            new_accept = list(stu_dfa.accept_states)
            if expected_acc and stu_dfa.start_state not in new_accept:
                new_accept.append(stu_dfa.start_state)
            elif not expected_acc and stu_dfa.start_state in new_accept:
                new_accept.remove(stu_dfa.start_state)
            
            import copy
            patched = DFAModel(
                states=stu_dfa.states,
                alphabet=stu_dfa.alphabet,
                start_state=stu_dfa.start_state,
                accept_states=new_accept,
                transitions=copy.deepcopy(stu_dfa.transitions)
            )
            ver = DFAEquivalenceChecker.check_equivalence(ref_dfa, patched)
            candidates.append(
                CandidateRepair(
                    id="fix-start-accept",
                    title="Toggle start state acceptance",
                    proposed_transitions=patched.transitions,
                    description=f"Change accepting status of start state '{stu_dfa.start_state}' to {'accepting' if expected_acc else 'non-accepting'}.",
                    rationale="The empty string ε distinguishes the automata, meaning start state acceptance must match.",
                    is_valid=True,
                    is_verified_equivalent=ver.is_equivalent,
                    counterexample_if_failed=ver.counterexample,
                    patched_dfa=patched
                )
            )

        # Generate candidates by targeted mutation along the counterexample path
        raw_ce = "" if ce_display == "ε" else ce_display
        if raw_ce:
            import copy
            for idx, symbol in enumerate(raw_ce):
                state_at_step = stu_path[idx]
                current_target = stu_dfa.transitions[state_at_step][symbol]
                
                # Test rerouting this transition to each valid state in student DFA
                for potential_target in stu_dfa.states:
                    if potential_target == current_target:
                        continue
                    
                    patched_trans = copy.deepcopy(stu_dfa.transitions)
                    patched_trans[state_at_step][symbol] = potential_target
                    
                    patched = DFAModel(
                        states=stu_dfa.states,
                        alphabet=stu_dfa.alphabet,
                        start_state=stu_dfa.start_state,
                        accept_states=list(stu_dfa.accept_states),
                        transitions=patched_trans
                    )
                    
                    val = DFAValidator.validate(patched)
                    if not val.is_valid:
                        continue

                    ver = DFAEquivalenceChecker.check_equivalence(ref_dfa, patched)
                    
                    if ver.is_equivalent:
                        candidates.append(
                            CandidateRepair(
                                id=f"fix-t-{state_at_step}-{symbol}-{potential_target}",
                                title=f"Redirect δ({state_at_step}, '{symbol}') -> '{potential_target}'",
                                proposed_transitions=patched.transitions,
                                description=f"Change transition from δ({state_at_step}, '{symbol}') = '{current_target}' to '{potential_target}'.",
                                rationale=f"Redirecting this transition directly resolves the counterexample '{ce_display}' and formally matches the reference language.",
                                is_valid=True,
                                is_verified_equivalent=True,
                                counterexample_if_failed=None,
                                patched_dfa=patched
                            )
                        )
                        break  # Found verified fix for this transition
                    elif len(candidates) < 4:
                        # Keep a plausible but failing candidate to demonstrate formal verification disproving it
                        candidates.append(
                            CandidateRepair(
                                id=f"cand-{state_at_step}-{symbol}-{potential_target}",
                                title=f"Alternative: δ({state_at_step}, '{symbol}') -> '{potential_target}'",
                                proposed_transitions=patched.transitions,
                                description=f"Divert δ({state_at_step}, '{symbol}') to '{potential_target}'.",
                                rationale=f"Tests alternate state transition at step {idx + 1}.",
                                is_valid=True,
                                is_verified_equivalent=False,
                                counterexample_if_failed=ver.counterexample,
                                patched_dfa=patched
                            )
                        )

        # Also check if accepting state set can be adjusted
        last_state = stu_path[-1]
        import copy
        new_acc_list = list(stu_dfa.accept_states)
        if expected_acc and last_state not in new_acc_list:
            new_acc_list.append(last_state)
        elif not expected_acc and last_state in new_acc_list:
            new_acc_list.remove(last_state)

        patched_acc = DFAModel(
            states=stu_dfa.states,
            alphabet=stu_dfa.alphabet,
            start_state=stu_dfa.start_state,
            accept_states=new_acc_list,
            transitions=copy.deepcopy(stu_dfa.transitions)
        )
        ver = DFAEquivalenceChecker.check_equivalence(ref_dfa, patched_acc)
        candidates.append(
            CandidateRepair(
                id=f"fix-acc-{last_state}",
                title=f"Adjust state '{last_state}' acceptance",
                proposed_transitions=patched_acc.transitions,
                description=f"Set '{last_state}' acceptance to {expected_acc}.",
                rationale=f"Counterexample '{ce_display}' ended at '{last_state}' and expected acceptance = {expected_acc}.",
                is_valid=True,
                is_verified_equivalent=ver.is_equivalent,
                counterexample_if_failed=ver.counterexample,
                patched_dfa=patched_acc
            )
        )

        # Deduplicate and sort: formally verified repairs first!
        candidates.sort(key=lambda c: (not c.is_verified_equivalent, c.title))
        top_candidates = candidates[:4]

        verified_count = sum(1 for c in top_candidates if c.is_verified_equivalent)

        return RepairSuggestionResponse(
            diagnostic_summary=(
                f"Automata Doctor detected a language divergence on counterexample '{ce_display}'. "
                f"The reference DFA expects '{ce_display}' to be {'ACCEPTED' if expected_acc else 'REJECTED'}, "
                f"but student DFA {'ACCEPTED' if stu_acc else 'REJECTED'} it. "
                f"{verified_count} candidate repair(s) were formally verified by the equivalence engine."
            ),
            counterexample_analysis=(
                f"At string '{ce_display}', student DFA traversed: {' -> '.join(stu_path)}. "
                f"The fault lies in state transition logic or final accepting state classification."
            ),
            candidate_repairs=top_candidates
        )
