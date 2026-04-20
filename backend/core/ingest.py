import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings


CORE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CORE_DIR.parent
ENV_FILE = BACKEND_DIR / ".env"
DATA_FILE = BACKEND_DIR / "data" / "tender.pdf"
CHROMA_DIR = BACKEND_DIR / "chroma_db"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Distinct Chroma collections on the same persist directory (Prompt 7).
TENDER_COLLECTION = "tender"
COMPANY_VAULT_COLLECTION = "company_vault"
DATA_DIR = BACKEND_DIR / "data"
COMPANY_PROFILE_DATA = DATA_DIR / "company_profile.pdf"


def validate_environment() -> None:
    """Load .env and ensure required variables exist."""
    load_dotenv(dotenv_path=ENV_FILE)
    groq_api_key = os.getenv("GROQ_API_KEY")

    if not groq_api_key:
        raise EnvironmentError(
            "Missing GROQ_API_KEY. Add it to your environment or .env file."
        )


def load_pdf_documents(pdf_path: Path):
    """Load PDF documents from disk."""
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    if not pdf_path.is_file():
        raise FileNotFoundError(f"Path is not a valid file: {pdf_path}")

    loader = PyMuPDFLoader(str(pdf_path))
    return loader.load()


def split_documents(documents):
    """Split documents into overlapping chunks for retrieval."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    return splitter.split_documents(documents)


def create_vector_store(
    chunks, persist_directory: Path, collection_name: str
):
    """Embed chunks with local HuggingFace model and persist in ChromaDB."""
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    persist_directory.mkdir(parents=True, exist_ok=True)

    return Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(persist_directory),
        collection_name=collection_name,
    )


def ingest_pdf_path(
    pdf_path: Path, collection_name: str = TENDER_COLLECTION
) -> tuple[int, int]:
    """
    Ingest a PDF into Chroma (default: tender collection).
    Returns (document_count, chunk_count).
    """
    validate_environment()
    documents = load_pdf_documents(pdf_path)

    if not documents:
        raise ValueError(f"No content loaded from PDF: {pdf_path}")

    chunks = split_documents(documents)
    if not chunks:
        raise ValueError("No chunks were generated from the source PDF.")

    create_vector_store(chunks, CHROMA_DIR, collection_name)
    return len(documents), len(chunks)


def ingest_company_profile_path(pdf_path: Path) -> tuple[int, int]:
    """Embed company profile into the company_vault Chroma collection."""
    return ingest_pdf_path(pdf_path, collection_name=COMPANY_VAULT_COLLECTION)


def ingest() -> None:
    """Run full ingestion pipeline on default ./data/tender.pdf."""
    docs_n, chunks_n = ingest_pdf_path(DATA_FILE)
    print(f"Ingestion completed successfully. Stored vectors in: {CHROMA_DIR}")
    print(f"Documents loaded: {docs_n}")
    print(f"Chunks created: {chunks_n}")


if __name__ == "__main__":
    try:
        ingest()
    except Exception as exc:
        print(f"Ingestion failed: {exc}", file=sys.stderr)
        sys.exit(1)
