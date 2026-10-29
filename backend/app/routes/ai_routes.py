from fastapi import APIRouter, HTTPException
from ..models.dfa_models import (
    NaturalLanguageRequest,
    NaturalLanguageResponse,
    CounterexampleExplainRequest,
    CounterexampleExplainResponse,
    RepairSuggestionRequest,
    RepairSuggestionResponse,
)
from ..services.ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["AI Features"])
ai_service = AIService()

@router.post("/interpret", response_model=NaturalLanguageResponse)
def interpret_language(req: NaturalLanguageRequest) -> NaturalLanguageResponse:
    try:
        return ai_service.interpret_language(req.description, req.alphabet)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language interpretation error: {str(e)}")

@router.post("/explain-counterexample", response_model=CounterexampleExplainResponse)
def explain_counterexample(req: CounterexampleExplainRequest) -> CounterexampleExplainResponse:
    try:
        return ai_service.explain_counterexample(
            dfa_a=req.dfa_a,
            dfa_b=req.dfa_b,
            counterexample=req.counterexample,
            dfa_a_accepted=req.dfa_a_accepted,
            dfa_b_accepted=req.dfa_b_accepted,
            dfa_a_path=req.dfa_a_path,
            dfa_b_path=req.dfa_b_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Counterexample explanation error: {str(e)}")

@router.post("/suggest-repairs", response_model=RepairSuggestionResponse)
def suggest_repairs(req: RepairSuggestionRequest) -> RepairSuggestionResponse:
    try:
        return ai_service.suggest_repairs(
            ref_dfa=req.reference_dfa,
            stu_dfa=req.student_dfa,
            counterexample=req.counterexample,
            expected_acc=req.expected_acceptance,
            stu_acc=req.student_acceptance,
            ref_path=req.reference_path,
            stu_path=req.student_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repair suggestion error: {str(e)}")
