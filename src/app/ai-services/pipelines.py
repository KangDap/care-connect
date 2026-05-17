"""Care Connect NLP and Apriori pipeline utilities.

This module focuses on the modeling pipeline only:
- text preprocessing
- slang normalization
- rule-based tag extraction
- transaction dataset generation
- Apriori association rule mining
- category-level frequent itemsets
- API-ready JSON payloads
- result export helpers
"""

from __future__ import annotations

import json
import math
import re
from functools import lru_cache
from pathlib import Path
from typing import Iterable

import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
from nltk.corpus import stopwords
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory


DEFAULT_SLANG_DICTIONARY: dict[str, str] = {
    "gue": "saya",
    "gw": "saya",
    "gua": "saya",
    "bokap": "ayah",
    "nyokap": "ibu",
    "doi": "dia",
    "dibentak": "bentak",
    "di bentak": "bentak",
    "dibully": "bully",
    "di-bully": "bully",
    "nggak": "tidak",
    "gak": "tidak",
    "ga": "tidak",
    "enggak": "tidak",
    "udah": "sudah",
    "ud": "sudah",
    "males": "malas",
    "sampe": "sampai",
    "pake": "pakai",
    "tetep": "tetap",
    "takut2": "takut",
}


DEFAULT_TAXONOMY: dict[str, tuple[str, ...]] = {
    "ayah": ("parent",),
    "bapak": ("parent",),
    "bokap": ("parent",),
    "ibu": ("parent",),
    "nyokap": ("parent",),
    "orang tua": ("parent",),
    "keluarga": ("family",),
    "suami": ("partner",),
    "istri": ("partner",),
    "pacar": ("partner",),
    "pasangan": ("partner",),
    "mantan": ("partner",),
    "kakak kelas": ("school_peer",),
    "teman sekolah": ("school_peer",),
    "geng": ("group_harassment",),
    "bully": ("bullying",),
    "perundung": ("bullying",),
    "perundungan": ("bullying",),
    "mengucilkan": ("bullying",),
    "ejek": ("bullying",),
    "gosip": ("bullying",),
    "doxing": ("cyberbullying",),
    "intimidasi": ("intimidation",),
    "ancam": ("intimidation",),
    "mengancam": ("intimidation",),
    "memaksa": ("coercion",),
    "paksa": ("coercion",),
    "bentak": ("verbal_abuse",),
    "hina": ("verbal_abuse",),
    "maki": ("verbal_abuse",),
    "kata kasar": ("verbal_abuse",),
    "kata kata kasar": ("verbal_abuse",),
    "pukul": ("physical_abuse",),
    "tampar": ("physical_abuse",),
    "tonjok": ("physical_abuse",),
    "serang": ("physical_abuse",),
    "aniaya": ("physical_abuse",),
    "ikat pinggang": ("physical_abuse",),
    "trauma": ("trauma",),
    "takut": ("anxiety",),
    "cemas": ("anxiety",),
    "khawatir": ("anxiety",),
    "depresi": ("depression",),
    "sedih": ("depression",),
    "tertekan": ("stress",),
    "stres": ("stress",),
    "malu": ("shame",),
    "isolasi": ("isolation",),
    "menarik diri": ("isolation",),
    "tidak berdaya": ("helplessness",),
    "uang": ("economic_abuse",),
    "nafkah": ("economic_abuse",),
    "jajan": ("economic_abuse",),
    "mendoxing": ("cyberbullying",),
    "fitnah": ("cyberbullying",),
    "sebar": ("cyberbullying",),
    "seksual": ("sexual_abuse",),
    "pelecehan": ("sexual_abuse",),
    "menangis": ("distress",),
    "tidak mau masuk sekolah": ("school_avoidance",),
    "tidak berani": ("fear",),
}


DEFAULT_EXTRA_STOPWORDS = {
    "saya",
    "aku",
    "kamu",
    "dia",
    "mereka",
    "kami",
    "kita",
    "yang",
    "dan",
    "di",
    "ke",
    "dari",
    "oleh",
    "untuk",
    "pada",
    "dengan",
    "sama",
    "itu",
    "ini",
    "ada",
    "saat",
    "karena",
    "jadi",
    "lagi",
    "sudah",
    "udah",
    "sangat",
    "bukan",
    "tetap",
    "tetep",
    "saja",
    "atau",
    "sampai",
    "dalam",
    "bisa",
    "tidak",
    "nggak",
    "gak",
    "ga",
}


IMPORTANT_CONTENT_WORDS = {
    "sering",
    "selalu",
    "jarang",
    "kadang",
    "kadang-kadang",
}


@lru_cache(maxsize=1)
def get_stemmer():
    return StemmerFactory().create_stemmer()


@lru_cache(maxsize=1)
def get_indonesian_stopwords() -> set[str]:
    try:
        words = set(stopwords.words("indonesian"))
    except LookupError:
        import nltk

        nltk.download("stopwords", quiet=True)
        try:
            words = set(stopwords.words("indonesian"))
        except LookupError:
            words = set()

    words.update(DEFAULT_EXTRA_STOPWORDS)
    words.difference_update(IMPORTANT_CONTENT_WORDS)
    return words


def build_slang_dictionary(custom_mapping: dict[str, str] | None = None) -> dict[str, str]:
    mapping = dict(DEFAULT_SLANG_DICTIONARY)
    if custom_mapping:
        mapping.update({key.lower(): value.lower() for key, value in custom_mapping.items()})
    return mapping


def build_taxonomy(custom_taxonomy: dict[str, Iterable[str]] | None = None) -> dict[str, tuple[str, ...]]:
    stemmer = get_stemmer()
    taxonomy = {}
    
    # Stem all keys from default taxonomy
    for key, value in DEFAULT_TAXONOMY.items():
        stemmed_key = stemmer.stem(key.lower())
        taxonomy[stemmed_key] = value
    
    # Stem all keys from custom taxonomy and merge
    if custom_taxonomy:
        for key, value in custom_taxonomy.items():
            stemmed_key = stemmer.stem(key.lower())
            tags = tuple(dict.fromkeys(tag.lower() for tag in value))
            taxonomy[stemmed_key] = tags
    
    return taxonomy


def normalize_text_columns(text_columns: str | Iterable[str] | None = None) -> list[str]:
    if text_columns is None:
        return ["title", "description"]
    if isinstance(text_columns, str):
        return [text_columns]
    return [column for column in text_columns if column]


def combine_text_fields(row: pd.Series, text_columns: list[str]) -> str:
    parts: list[str] = []
    for column in text_columns:
        if column in row and pd.notna(row[column]):
            value = str(row[column]).strip()
            if value:
                parts.append(value)
    return " ".join(parts).strip()


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize_text(text: str) -> list[str]:
    cleaned_text = clean_text(text)
    if not cleaned_text:
        return []
    return cleaned_text.split()


def normalize_slang(tokens: Iterable[str], slang_dictionary: dict[str, str] | None = None) -> list[str]:
    mapping = build_slang_dictionary(slang_dictionary)
    normalized_tokens: list[str] = []
    for token in tokens:
        normalized_tokens.append(mapping.get(token.lower(), token.lower()))
    return normalized_tokens


def remove_stopwords(tokens: Iterable[str], stopword_set: set[str] | None = None) -> list[str]:
    stopword_lookup = stopword_set or get_indonesian_stopwords()
    return [token for token in tokens if token not in stopword_lookup]


def stem_tokens(tokens: Iterable[str]) -> list[str]:
    stemmer = get_stemmer()
    return [stemmer.stem(token) for token in tokens]


def preprocess_text(
    text: str | None,
    slang_dictionary: dict[str, str] | None = None,
    stopword_set: set[str] | None = None,
) -> list[str]:
    if text is None or pd.isna(text):
        return []

    tokens = tokenize_text(str(text))
    tokens = normalize_slang(tokens, slang_dictionary)
    tokens = remove_stopwords(tokens, stopword_set)
    tokens = stem_tokens(tokens)
    return [token for token in tokens if token]


def generate_ngrams(tokens: list[str], max_n: int = 3) -> list[str]:
    phrases: list[str] = []
    token_count = len(tokens)
    for n in range(1, max_n + 1):
        for index in range(token_count - n + 1):
            phrases.append(" ".join(tokens[index : index + n]))
    return phrases


def extract_tags(
    tokens: list[str],
    taxonomy: dict[str, tuple[str, ...]] | None = None,
    max_ngram: int = 3,
) -> list[str]:
    taxonomy_map = build_taxonomy(taxonomy)
    matched_tags: list[str] = []

    for phrase in generate_ngrams(tokens, max_n=max_ngram):
        if phrase in taxonomy_map:
            matched_tags.extend(taxonomy_map[phrase])

    return list(dict.fromkeys(matched_tags))


def process_reports(
    reports_df: pd.DataFrame,
    text_columns: str | Iterable[str] | None = ("title", "description"),
    slang_dictionary: dict[str, str] | None = None,
    taxonomy: dict[str, tuple[str, ...]] | None = None,
    stopword_set: set[str] | None = None,
) -> pd.DataFrame:
    normalized_text_columns = normalize_text_columns(text_columns)
    processed = reports_df.copy()
    processed["source_text"] = processed.apply(
        lambda row: combine_text_fields(row, normalized_text_columns),
        axis=1,
    )
    processed["clean_text"] = processed["source_text"].map(clean_text)
    processed["tokens"] = processed["source_text"].map(
        lambda value: preprocess_text(value, slang_dictionary=slang_dictionary, stopword_set=stopword_set)
    )
    processed["tags"] = processed["tokens"].map(lambda tokens: extract_tags(tokens, taxonomy=taxonomy))
    processed["transaction"] = processed["tags"]
    return processed


def build_transactions(tag_series: Iterable[Iterable[str]]) -> list[list[str]]:
    transactions: list[list[str]] = []
    for tags in tag_series:
        unique_tags = list(dict.fromkeys(tag for tag in tags if tag))
        if unique_tags:
            transactions.append(unique_tags)
    return transactions


def run_apriori(
    transactions: list[list[str]],
    min_support: float = 0.1,
    min_confidence: float = 0.6,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    itemset_columns = ["support", "itemsets"]
    rule_columns = [
        "antecedents",
        "consequents",
        "support",
        "confidence",
        "lift",
        "leverage",
        "conviction",
    ]

    if not transactions:
        return pd.DataFrame(columns=itemset_columns), pd.DataFrame(columns=rule_columns)

    encoder = TransactionEncoder()
    encoded_array = encoder.fit(transactions).transform(transactions)
    encoded_df = pd.DataFrame(encoded_array, columns=encoder.columns_)

    frequent_itemsets = apriori(encoded_df, min_support=min_support, use_colnames=True)
    if frequent_itemsets.empty:
        return frequent_itemsets, pd.DataFrame(columns=rule_columns)

    rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)
    if rules.empty:
        return frequent_itemsets, pd.DataFrame(columns=rule_columns)

    rules = rules[["antecedents", "consequents", "support", "confidence", "lift", "leverage", "conviction"]]
    rules = rules.sort_values(["lift", "confidence", "support"], ascending=False).reset_index(drop=True)
    frequent_itemsets = frequent_itemsets.sort_values(["support", "itemsets"], ascending=[False, True]).reset_index(drop=True)
    return frequent_itemsets, rules


def _frozenset_to_list(value: frozenset[str]) -> list[str]:
    return sorted(str(item) for item in value)


def itemsets_to_records(itemsets_df: pd.DataFrame) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    if itemsets_df.empty:
        return records

    for _, row in itemsets_df.iterrows():
        records.append(
            {
                "support": float(row["support"]),
                "itemsets": _frozenset_to_list(row["itemsets"]),
            }
        )
    return records


def rules_to_records(rules_df: pd.DataFrame) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    if rules_df.empty:
        return records

    for _, row in rules_df.iterrows():
        records.append(
            {
                "antecedents": _frozenset_to_list(row["antecedents"]),
                "consequents": _frozenset_to_list(row["consequents"]),
                "support": float(row["support"]),
                "confidence": float(row["confidence"]),
                "lift": float(row["lift"]),
                "leverage": float(row["leverage"]),
                "conviction": 999.0 if math.isinf(row["conviction"]) else float(row["conviction"]),
            }
        )
    return records


def build_category_itemsets(
    processed_df: pd.DataFrame,
    category_column: str = "category",
    top_n: int = 10,
    min_support: float = 0.1,
) -> pd.DataFrame:
    records: list[dict[str, object]] = []
    if processed_df.empty or category_column not in processed_df.columns:
        return pd.DataFrame(columns=[category_column, "support", "itemsets"])

    for category, group_df in processed_df.groupby(category_column, dropna=False):
        transactions = build_transactions(group_df["tags"])
        frequent_itemsets, _ = run_apriori(transactions, min_support=min_support, min_confidence=1.0)
        if frequent_itemsets.empty:
            continue

        top_itemsets = frequent_itemsets.head(top_n)
        for _, row in top_itemsets.iterrows():
            records.append(
                {
                    category_column: category,
                    "support": float(row["support"]),
                    "itemsets": _frozenset_to_list(row["itemsets"]),
                }
            )

    return pd.DataFrame(records, columns=[category_column, "support", "itemsets"])


def category_itemsets_to_records(
    category_itemsets_df: pd.DataFrame,
    category_column: str = "category",
) -> dict[str, list[dict[str, object]]]:
    grouped: dict[str, list[dict[str, object]]] = {}
    if category_itemsets_df.empty:
        return grouped

    for category, group_df in category_itemsets_df.groupby(category_column, dropna=False):
        grouped[str(category)] = [
            {"support": float(row["support"]), "itemsets": list(row["itemsets"])}
            for _, row in group_df.iterrows()
        ]
    return grouped


def build_api_payload(
    frequent_itemsets_df: pd.DataFrame,
    rules_df: pd.DataFrame,
    category_itemsets_df: pd.DataFrame,
) -> dict[str, object]:
    return {
        "global": {
            "association_rules": rules_to_records(rules_df),
            "frequent_itemsets": itemsets_to_records(frequent_itemsets_df),
        },
        "by_category": category_itemsets_to_records(category_itemsets_df),
    }


def export_results(
    frequent_itemsets_df: pd.DataFrame,
    rules_df: pd.DataFrame,
    category_itemsets_df: pd.DataFrame | None = None,
    output_dir: str | Path = "outputs",
    prefix: str = "care_connect",
) -> dict[str, Path]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    itemsets_path = output_path / f"{prefix}_frequent_itemsets.csv"
    rules_csv_path = output_path / f"{prefix}_association_rules.csv"
    rules_json_path = output_path / f"{prefix}_association_rules.json"
    category_itemsets_path = output_path / f"{prefix}_category_itemsets.csv"
    category_itemsets_json_path = output_path / f"{prefix}_category_itemsets.json"
    api_payload_path = output_path / f"{prefix}_api_payload.json"

    frequent_itemsets_df.to_csv(itemsets_path, index=False)

    export_rules_df = rules_df.copy()
    if not export_rules_df.empty:
        export_rules_df["antecedents"] = export_rules_df["antecedents"].map(_frozenset_to_list)
        export_rules_df["consequents"] = export_rules_df["consequents"].map(_frozenset_to_list)
    export_rules_df.to_csv(rules_csv_path, index=False)

    with rules_json_path.open("w", encoding="utf-8") as handle:
        json.dump(rules_to_records(rules_df), handle, ensure_ascii=False, indent=2)

    if category_itemsets_df is not None:
        export_category_df = category_itemsets_df.copy()
        if not export_category_df.empty:
            export_category_df["itemsets"] = export_category_df["itemsets"].map(list)
        export_category_df.to_csv(category_itemsets_path, index=False)

        with category_itemsets_json_path.open("w", encoding="utf-8") as handle:
            json.dump(category_itemsets_to_records(category_itemsets_df), handle, ensure_ascii=False, indent=2)

        with api_payload_path.open("w", encoding="utf-8") as handle:
            json.dump(
                build_api_payload(frequent_itemsets_df, rules_df, category_itemsets_df),
                handle,
                ensure_ascii=False,
                indent=2,
            )

    return {
        "frequent_itemsets_csv": itemsets_path,
        "association_rules_csv": rules_csv_path,
        "association_rules_json": rules_json_path,
        "category_itemsets_csv": category_itemsets_path,
        "category_itemsets_json": category_itemsets_json_path,
        "api_payload_json": api_payload_path,
    }


def pipeline_from_reports(
    reports_df: pd.DataFrame,
    text_columns: str | Iterable[str] | None = ("title", "description"),
    min_support: float = 0.1,
    min_confidence: float = 0.6,
    top_n_category_itemsets: int = 10,
    slang_dictionary: dict[str, str] | None = None,
    taxonomy: dict[str, tuple[str, ...]] | None = None,
    stopword_set: set[str] | None = None,
    category_column: str = "category",
) -> dict[str, object]:
    processed_df = process_reports(
        reports_df,
        text_columns=text_columns,
        slang_dictionary=slang_dictionary,
        taxonomy=taxonomy,
        stopword_set=stopword_set,
    )
    transactions = build_transactions(processed_df["tags"])
    frequent_itemsets_df, rules_df = run_apriori(
        transactions,
        min_support=min_support,
        min_confidence=min_confidence,
    )
    category_itemsets_df = build_category_itemsets(
        processed_df,
        category_column=category_column,
        top_n=top_n_category_itemsets,
        min_support=min_support,
    )

    return {
        "processed_df": processed_df,
        "transactions": transactions,
        "frequent_itemsets_df": frequent_itemsets_df,
        "rules_df": rules_df,
        "category_itemsets_df": category_itemsets_df,
        "api_payload": build_api_payload(frequent_itemsets_df, rules_df, category_itemsets_df),
        "rules_json": rules_to_records(rules_df),
    }