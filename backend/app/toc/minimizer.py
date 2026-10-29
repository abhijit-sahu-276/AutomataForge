from typing import List, Dict, Set, Tuple
from ..models.dfa_models import DFAModel, MinimizationResult, MinimizationStep
from .dfa import DFAValidator
from .equivalence import DFAEquivalenceChecker

class DFAMinimizer:
    @staticmethod
    def minimize(dfa: DFAModel) -> MinimizationResult:
        # 1. Validation
        val = DFAValidator.validate(dfa)
        if not val.is_valid:
            raise ValueError(f"Cannot minimize invalid DFA: {'; '.join(val.errors)}")

        all_states = sorted(list(set(dfa.states)))
        reachable_states_set = DFAValidator.get_reachable_states(dfa)
        reachable = sorted(list(reachable_states_set))
        unreachable = sorted(list(set(all_states) - reachable_states_set))

        steps: List[MinimizationStep] = []

        # Step 1: Reachability step
        reach_desc = f"Identified {len(reachable)} reachable state(s) from start state '{dfa.start_state}'."
        if unreachable:
            reach_desc += f" Removed {len(unreachable)} unreachable state(s): {', '.join(unreachable)}."
        else:
            reach_desc += " All states are reachable."

        steps.append(
            MinimizationStep(
                step_number=1,
                title="Reachable State Analysis",
                description=reach_desc,
                partitions=[reachable] if reachable else [[]],
                split_details=[f"Reachable states: {reachable}", f"Pruned unreachable: {unreachable}"]
            )
        )

        accept_reachable = sorted([s for s in reachable if s in dfa.accept_states])
        non_accept_reachable = sorted([s for s in reachable if s not in dfa.accept_states])

        # Step 2: Initial Partition P0 = { F, Q \ F }
        initial_partition: List[List[str]] = []
        if non_accept_reachable:
            initial_partition.append(non_accept_reachable)
        if accept_reachable:
            initial_partition.append(accept_reachable)

        # Edge case: If reachable is empty or all accepting / all non-accepting
        if not accept_reachable:
            p0_desc = "All reachable states are non-accepting (empty language). Initial partition has 1 group."
        elif not non_accept_reachable:
            p0_desc = "All reachable states are accepting. Initial partition has 1 group."
        else:
            p0_desc = (
                f"Split into 2 initial groups: Non-accepting states {non_accept_reachable} "
                f"and Accepting states {accept_reachable}."
            )

        steps.append(
            MinimizationStep(
                step_number=2,
                title="Initial Partition P₀ (0-Equivalence)",
                description=p0_desc,
                partitions=initial_partition,
                split_details=[
                    f"Group 1 (Non-accepting): {non_accept_reachable}" if non_accept_reachable else "No non-accepting states",
                    f"Group 2 (Accepting): {accept_reachable}" if accept_reachable else "No accepting states",
                ]
            )
        )

        # 4. Refinement iterations (Hopcroft / Moore style partition refinement)
        current_partitions = [list(g) for g in initial_partition]
        alphabet = sorted(list(set(dfa.alphabet)))
        iteration = 1

        while True:
            # Map state to its current partition group index
            state_to_group: Dict[str, int] = {}
            for g_idx, grp in enumerate(current_partitions):
                for st in grp:
                    state_to_group[st] = g_idx

            new_partitions: List[List[str]] = []
            iteration_splits: List[str] = []
            changed = False

            for grp in current_partitions:
                if len(grp) <= 1:
                    new_partitions.append(grp)
                    continue

                # Group states by signature: tuple of group indices for each alphabet symbol
                signature_buckets: Dict[Tuple[int, ...], List[str]] = {}
                for st in grp:
                    sig: List[int] = []
                    for sym in alphabet:
                        nxt = dfa.transitions[st][sym]
                        sig.append(state_to_group.get(nxt, -1))
                    sig_tuple = tuple(sig)
                    if sig_tuple not in signature_buckets:
                        signature_buckets[sig_tuple] = []
                    signature_buckets[sig_tuple].append(st)

                if len(signature_buckets) > 1:
                    changed = True
                    split_groups = [sorted(subgrp) for subgrp in signature_buckets.values()]
                    new_partitions.extend(split_groups)
                    iteration_splits.append(
                        f"Group {grp} split into {len(split_groups)} subgroups: {split_groups} because transitions lead to different partition classes."
                    )
                else:
                    new_partitions.append(grp)

            # Sort partitions for deterministic output
            new_partitions = sorted(new_partitions, key=lambda g: g[0] if g else "")

            if changed:
                steps.append(
                    MinimizationStep(
                        step_number=len(steps) + 1,
                        title=f"Partition Refinement Round {iteration} (P_{iteration})",
                        description=f"Refined partitions from {len(current_partitions)} to {len(new_partitions)} equivalence classes.",
                        partitions=new_partitions,
                        split_details=iteration_splits
                    )
                )
                current_partitions = new_partitions
                iteration += 1
            else:
                steps.append(
                    MinimizationStep(
                        step_number=len(steps) + 1,
                        title="Fixed Point Reached",
                        description=f"No further partition splits occurred in Round {iteration}. All states in each group are indistinguishable (k-equivalent for all k).",
                        partitions=current_partitions,
                        split_details=["Equivalence classes have stabilized."]
                    )
                )
                break

        # 5. Merge equivalent states and construct Minimized DFA
        # Name each merged state: if group has 1 state, keep name. If multiple, join e.g. "q0_q1" or "[q0, q1]"
        state_to_merged_name: Dict[str, str] = {}
        merged_states: List[str] = []

        for grp in current_partitions:
            if not grp:
                continue
            # If the group contains start state, prefer keeping it recognizable
            if dfa.start_state in grp:
                merged_name = "_".join(sorted(grp)) if len(grp) > 1 else grp[0]
            else:
                merged_name = "_".join(sorted(grp)) if len(grp) > 1 else grp[0]

            for st in grp:
                state_to_merged_name[st] = merged_name
            merged_states.append(merged_name)

        min_start_state = state_to_merged_name.get(dfa.start_state, dfa.start_state)
        min_accept_states: List[str] = []
        for grp in current_partitions:
            if any(st in dfa.accept_states for st in grp):
                name = state_to_merged_name[grp[0]]
                if name not in min_accept_states:
                    min_accept_states.append(name)

        min_transitions: Dict[str, Dict[str, str]] = {}
        for grp in current_partitions:
            rep_state = grp[0]
            merged_name = state_to_merged_name[rep_state]
            min_transitions[merged_name] = {}
            for sym in alphabet:
                target_state = dfa.transitions[rep_state][sym]
                min_transitions[merged_name][sym] = state_to_merged_name[target_state]

        minimized_dfa = DFAModel(
            states=merged_states,
            alphabet=alphabet,
            start_state=min_start_state,
            accept_states=min_accept_states,
            transitions=min_transitions
        )

        # 6. Verify formal equivalence between original and minimized
        equiv_check = DFAEquivalenceChecker.check_equivalence(dfa, minimized_dfa)
        is_verified = equiv_check.is_equivalent

        return MinimizationResult(
            original_states_count=len(dfa.states),
            minimized_states_count=len(merged_states),
            unreachable_states=unreachable,
            reachable_states=reachable,
            steps=steps,
            final_partitions=current_partitions,
            minimized_dfa=minimized_dfa,
            is_verified_equivalent=is_verified
        )

