import os, re, json, faiss, numpy as np
from pathlib import Path
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai import types
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "chunks__voicetips.jsonl"

def _resolve_index_dir() -> Path:
    cand = [BASE_DIR / "index", BASE_DIR.parent / "index"]
    for p in cand:
        if (p / "chunks.faiss").exists() and (p / "chunks.meta.jsonl").exists():
            return p
    raise FileNotFoundError("FAISS 인덱스를 찾지 못했습니다.")

INDEX_DIR = _resolve_index_dir()
FAISS_PATH = INDEX_DIR / "chunks.faiss"
META_PATH = INDEX_DIR / "chunks.meta.jsonl"
DIM_PATH = INDEX_DIR / "emb_model_dim.npy"
EMB_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

def iter_jsonl(path: Path):
    with open(path, "r", encoding="utf-8-sig") as f:
        for lineno, raw in enumerate(f, 1):
            line = raw.strip()
            if not line or line.startswith("```"):
                continue
            line = re.sub(r"```.*$", "", line).strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError as e:
                preview = raw.replace("\n", "\\n")[:200]
                raise ValueError(f"[JSONL 오류] {path.name}:{lineno} -> {preview}\n{e}")

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise EnvironmentError("GEMINI_API_KEY 가 설정되지 않았습니다.")
client = genai.Client(api_key=api_key)

index = faiss.read_index(str(FAISS_PATH))
dim = int(np.load(DIM_PATH)[0])
metas: List[Dict] = [json.loads(l) for l in open(META_PATH, "r", encoding="utf-8")]

objs = list(iter_jsonl(DATA_PATH))
texts: List[str] = []
for o in objs:
    t = (o.get("text") or "").strip()
    if not t:
        continue
    texts.append(t)

if not (len(texts) == index.ntotal == len(metas)):
    raise RuntimeError(f"사이즈 불일치: texts={len(texts)}, metas={len(metas)}, index={index.ntotal}")

embedder = SentenceTransformer(EMB_MODEL)

def retrieve(query: str, k: int = 5) -> List[Dict]:
    qv = embedder.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    D, I = index.search(qv, k)
    out = []
    for rank, idx in enumerate(I[0]):
        if idx == -1:
            continue
        m = dict(metas[idx])
        m.update({
            "rank": rank + 1,
            "score": float(D[0][rank]),
            "text": texts[idx],
        })
        out.append(m)
    return out

def build_context(ctxs: List[Dict], max_chars: int = 3500) -> str:
    parts = []
    for c in ctxs:
        tag = f"[{c.get('doc_id','')}/{c.get('chunk_id','')}] {c.get('category','')} | {c.get('title','')}"
        src = c.get("source_title", "")
        block = f"{tag}\n출처: {src}\n---\n{c['text']}"
        parts.append(block)
    merged = "\n\n-----\n\n".join(parts)
    return merged[:max_chars]

SYSTEM_INSTRUCTION = """너는 '보이스피싱 분석 전문가 AI'다.
반드시 JSON 형식으로만 응답하라. 여분의 문장/코드는 절대 출력하지 말라.

출력 스키마:
{
  "is_phishing": "보이스피싱일 확률 (0~1)",
  "evidence": "문장 1~2개",
  "solution": "즉시 실행 지침 2~4문장",
  "reference_chunk_id": ["chunk_id1","chunk_id2", ...]
}

규칙:
- 판단/지침은 [참고 자료]에 근거해야 한다. 근거가 부족하면 is_phishing=null.
- solution에는 신고/지급정지/대표번호 재확인 등 구체적 행동을 포함.
"""

def generate_rag_answer(user_query: str, k: int = 5) -> str:
    ctxs = retrieve(user_query, k=k)
    if not ctxs:
        return json.dumps({
            "is_phishing": None,
            "evidence": "검색된 근거가 없습니다.",
            "solution": "기관 공식 대표번호로 재확인하고, 의심 시 112 또는 1332(금감원)로 문의하세요.",
            "reference_chunk_id": []
        }, ensure_ascii=False)
    reference_ids = [c.get("chunk_id","") or c.get("doc_id","") for c in ctxs]
    context_block = build_context(ctxs)
    user_msg = f"""[참고 자료 시작]
{context_block}
[참고 자료 끝]

[사용자 질문 시작]
{user_query}
[사용자 질문 끝]

요청: 위 [참고 자료]만을 근거로 JSON 스키마에 맞춰 응답하라.
가능하면 "reference_chunk_id"에 다음 아이디들 중 실제로 사용한 것을 넣어라: {reference_ids}
"""
    tools = [types.Tool(googleSearch=types.GoogleSearch())]
    cfg = types.GenerateContentConfig(
        temperature=0.2,
        top_p=0.9,
        max_output_tokens=1000,
        thinking_config=types.ThinkingConfig(thinking_budget=-1),
        tools=tools,
        system_instruction=[types.Part.from_text(text=SYSTEM_INSTRUCTION)],
    )
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[types.Content(role="user", parts=[types.Part.from_text(text=user_msg)])],
        config=cfg,
    )
    return resp.text

if __name__ == "__main__":
    q = "검찰이라며 내 계좌로 자산 이전하라는데 진짜인가요?"
    out = generate_rag_answer(q, k=5)
    try:
        print(json.dumps(json.loads(out), ensure_ascii=False, indent=2))
    except Exception:
        print(out)
