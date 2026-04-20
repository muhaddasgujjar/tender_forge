"""
RAG-powered Q&A over indexed tender + company profile (Chroma).
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from .graph import (
    COMPANY_VAULT_COLLECTION,
    CHROMA_DIR,
    TENDER_COLLECTION,
    get_llm,
    load_vector_store,
)


def chroma_has_index() -> bool:
    """True if persist directory exists and is non-empty."""
    if not CHROMA_DIR.is_dir():
        return False
    try:
        return any(CHROMA_DIR.iterdir())
    except OSError:
        return False


def _retrieve_collection_text(query: str, collection_name: str, k: int) -> str:
    store = load_vector_store(collection_name=collection_name)
    docs = store.similarity_search(query, k=k)
    if not docs:
        return ""
    return "\n\n---\n\n".join(d.page_content for d in docs)


def retrieve_bid_context(user_question: str, k_tender: int = 8, k_company: int = 6) -> tuple[str, str]:
    """Pull relevant chunks from tender and company vault for the question."""
    tender = _retrieve_collection_text(user_question, TENDER_COLLECTION, k_tender)
    company = _retrieve_collection_text(user_question, COMPANY_VAULT_COLLECTION, k_company)
    return tender, company


def answer_bid_question(message: str, temperature: float = 0.2) -> str:
    """
    Answer using Groq + retrieved tender/company context only (grounded RAG).
    """
    message = (message or "").strip()
    if not message:
        return ""

    tender_ctx, company_ctx = retrieve_bid_context(message)
    if not tender_ctx.strip() and not company_ctx.strip():
        return (
            "No matching passages were retrieved from your indexed tender or company profile. "
            "Upload both PDFs and run **Generate** so the knowledge base is built, then try again."
        )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "You are an expert assistant for Pakistan public procurement (PPRA-style tenders). "
                    "Answer ONLY using the Tender Context and Company Context below. "
                    "If the documents do not contain the answer, say clearly that the information is "
                    "not present in the indexed materials — do not invent facts, dates, amounts, or "
                    "requirements. Keep answers concise, professional, and suitable for a bid team. "
                    "When helpful, mention whether detail comes from the tender vs. company profile."
                ),
            ),
            (
                "human",
                (
                    "### Tender context (retrieved)\n{tender_ctx}\n\n"
                    "### Company profile context (retrieved)\n{company_ctx}\n\n"
                    "### Question\n{question}"
                ),
            ),
        ]
    )

    llm: ChatGroq = get_llm(temperature=temperature)
    chain = prompt | llm
    tender_block = tender_ctx[:14000] or "(No tender passages retrieved.)"
    company_block = company_ctx[:14000] or "(No company passages retrieved.)"
    response = chain.invoke(
        {
            "tender_ctx": tender_block,
            "company_ctx": company_block,
            "question": message,
        }
    )
    return (response.content or "").strip()
