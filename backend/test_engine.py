import json

from core.graph import TenderState, app


NODE_LABELS = {
    "extractor_node": "--- EXTRACTING REQUIREMENTS ---",
    "generator_node": "--- DRAFTING PROPOSAL ---",
    "auditor_node": "--- AUDITING DRAFT ---",
    "export_node": "--- EXPORTING DOCUMENT ---",
}


def run_engine() -> dict:
    initial_state: TenderState = {
        "tender_context": "",
        "requirements_json": {},
        "draft_proposal": "",
        "audit_feedback": "",
        "audit_status": "",
        "revision_count": 0,
    }

    latest_state: dict = dict(initial_state)

    print("=== TENDERFORGE PK ENGINE TEST ===")
    for step in app.stream(initial_state):
        for node_name, node_output in step.items():
            print(NODE_LABELS.get(node_name, f"--- {node_name.upper()} ---"))
            print(json.dumps(node_output, indent=2, default=str))
            print()
            if isinstance(node_output, dict):
                latest_state.update(node_output)

    print("=== FINAL STATUS ===")
    print(f"revision_count: {latest_state.get('revision_count')}")
    print(f"audit_status: {latest_state.get('audit_status')}")
    return latest_state


if __name__ == "__main__":
    run_engine()
