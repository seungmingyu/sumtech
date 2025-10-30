import json, os, faiss, numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "chunks__voicetips.jsonl"

INDEX_DIR  = Path("index")
INDEX_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
model = SentenceTransformer(MODEL_NAME)

texts = []
metas = []

with open(DATA_PATH, "r", encoding="utf-8") as f:
    for line in f:
        if not line.strip(): continue
        obj = json.loads(line)
        text = obj.get("text", "").strip()
        if not text: continue
        texts.append(text)
        metas.append({
            "doc_id": obj.get("doc_id", ""),
            "chunk_id": obj.get("chunk_id", ""),
            "title": obj.get("title", ""),
            "category": obj.get("category", ""),
            "source_title": obj.get("source_title", ""),
            "source_url": obj.get("source_url", ""),
        })

embs = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
dim = embs.shape[1]

index = faiss.IndexFlatIP(dim)
index.add(embs)

faiss.write_index(index, str(INDEX_DIR / "chunks.faiss"))
np.save(INDEX_DIR / "emb_model_dim.npy", np.array([dim]))
with open(INDEX_DIR / "chunks.meta.jsonl", "w", encoding="utf-8") as f:
    for m in metas:
        f.write(json.dumps(m, ensure_ascii=False) + "\n")

print(f"[OK] embeddings: {len(texts)}, dim: {dim}")
print(f"[OK] saved: {INDEX_DIR/'chunks.faiss'} / {INDEX_DIR/'chunks.meta.jsonl'}")


