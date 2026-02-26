from __future__ import annotations

import datetime as dt
import json
from typing import Any

import httpx

from backend.config import Settings
from backend.logic.http_sse import iter_appmedo_sse_chunks
from backend.logic.supabase_rest import SupabaseRest


def _month_key(d: str) -> str:
    return d[:7]


async def handle_chat_stream(
    *,
    inputs: dict[str, Any],
    settings: Settings,
    publish_chunk,
    publish_done,
    publish_error,
) -> None:
    message = inputs.get("message")
    user_id = inputs.get("userId") or inputs.get("user_id")
    token = inputs.get("supabase_access_token")
    correlation_id = inputs.get("correlation_id")

    if not message or not user_id or not token or not correlation_id:
        await publish_error("Message, userId, correlation_id and token are required")
        return

    sb = SupabaseRest(settings.supabase_url, settings.supabase_anon_key)

    try:
        profile = (await sb.select(access_token=token, table="profiles", params={"id": f"eq.{user_id}", "limit": "1"}))
        profile = profile[0] if profile else None

        incomes = await sb.select(access_token=token, table="income_records", params={"user_id": f"eq.{user_id}"})
        budgets = await sb.select(
            access_token=token,
            table="budgets",
            params={
                "user_id": f"eq.{user_id}",
                "is_active": "eq.true",
                "order": "created_at.desc",
                "limit": "1",
            },
        )
        transactions = await sb.select(
            access_token=token,
            table="transactions",
            params={
                "user_id": f"eq.{user_id}",
                "order": "transaction_date.desc",
                "limit": "50",
            },
        )
        chat_history = await sb.select(
            access_token=token,
            table="chat_history",
            params={
                "user_id": f"eq.{user_id}",
                "order": "created_at.desc",
                "limit": "20",
            },
        )
        documents = await sb.select(
            access_token=token,
            table="documents",
            params={
                "user_id": f"eq.{user_id}",
                "order": "created_at.desc",
                "limit": "10",
            },
        )

        total_income = 0.0
        for inc in incomes:
            try:
                total_income += float(inc.get("amount") or 0)
            except Exception:
                pass

        spending_by_category: dict[str, float] = {}
        current_month = dt.date.today().isoformat()[:7]
        for t in transactions:
            d = str(t.get("transaction_date") or "")
            if _month_key(d) == current_month:
                cat = str(t.get("category") or "other")
                try:
                    amt = float(t.get("amount") or 0)
                except Exception:
                    amt = 0
                spending_by_category[cat] = spending_by_category.get(cat, 0.0) + amt

        context = {
            "userMode": (profile or {}).get("user_mode") if profile else "personal",
            "totalIncome": total_income,
            "incomeRecords": incomes,
            "activeBudget": budgets[0] if budgets else None,
            "recentTransactions": transactions[:15],
            "allCategorySpending": spending_by_category,
            "totalSpentThisMonth": sum(spending_by_category.values()),
            "documentCount": len(documents),
        }

        conversation_history = list(reversed(chat_history[:10]))
        conversation_history = [
            {"role": h.get("role"), "parts": [{"text": h.get("message", "")}]} for h in conversation_history
        ]

        system_prompt = (
            "You are a personal finance assistant. You ONLY answer questions about personal finance, budgeting, expense tracking, and financial planning.\n\n"
            "STRICT RULES:\n"
            "1. If the user asks anything outside of personal finance, respond EXACTLY with: \"I'm designed to assist only with personal finance, budgeting, and expense-tracking questions.\"\n"
            "2. Use ₹ (Indian Rupees) for currency amounts.\n"
            "3. Base answers on the provided user context and transactions.\n\n"
            f"CONTEXT JSON:\n{json.dumps(context, ensure_ascii=False)}\n"
        )

        gemini_request = {
            "contents": [
                {"role": "user", "parts": [{"text": system_prompt}]},
                {"role": "model", "parts": [{"text": "I understand. I will only answer personal finance questions based on the provided user data."}]},
                *conversation_history,
                {"role": "user", "parts": [{"text": str(message)}]},
            ]
        }

        # persist user message
        await sb.insert(
            access_token=token,
            table="chat_history",
            rows={"user_id": user_id, "role": "user", "message": message},
            returning="minimal",
        )

        full_response = ""
        async with httpx.AsyncClient(timeout=None) as client:
            resp = await client.post(
                settings.gemini_url,
                headers={
                    "Content-Type": "application/json",
                    "X-Gateway-Authorization": f"Bearer {settings.integrations_api_key}",
                },
                json=gemini_request,
            )
            resp.raise_for_status()

            async for chunk in iter_appmedo_sse_chunks(resp):
                full_response += chunk
                await publish_chunk(chunk)

        if full_response:
            await sb.insert(
                access_token=token,
                table="chat_history",
                rows={"user_id": user_id, "role": "model", "message": full_response},
                returning="minimal",
            )

        await publish_done()

    except Exception as e:
        await publish_error(str(e))
