import google.generativeai as genai
from rag.vectorstore import retrieve_context
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_website_with_gemini(prompt: str) -> str:
    context = retrieve_context(prompt)
    full_prompt = (
        f"You are an AI website generator. Use the following context to help:\n"
        f"{context}\n\n"
        f"User request: {prompt}\n\n"
        f"Generate a structured website layout and content."
    )

    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(full_prompt)
    return response.text
