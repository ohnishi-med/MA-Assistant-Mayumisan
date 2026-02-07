import os
import sys
import json
import openai
from pathlib import Path

# --- Configuration ---
# Set your OpenAI API Key here, or export it as an environment variable 'OPENAI_API_KEY'
# api_key = "sk-..."
api_key = os.getenv("OPENAI_API_KEY")

DEFAULT_MODEL = "gpt-4o"
SYSTEM_PROMPT = """
You are an expert technical writer and data structurer. Your task is to convert raw text (which may be unstructured or transcribed from voice input) into a structured JSON format suitable for the "Mayumisan" manual management system.

## Output Format
You must output a **single JSON array** containing objects with the following structure. Do not output markdown code blocks (```json ... ```), just the raw JSON string if possible, or ensure it is valid JSON.

```json
[
  {
    "title": "Clear and Concise Title",
    "category": "ParentCategory/ChildCategory",
    "content": "# Heading\\n\\nContent in Markdown format...",
    "tags": ["Tag1", "Tag2"]
  }
]
```

## Rules
1. **Title**: Infer a suitable title if not explicitly stated.
2. **Category**: Infer a logical sub-category path (e.g., "Product A/Troubleshooting"). **Important**: Do NOT include "Import" or "取込" at the start; just the logical structure. Use forward slashes `/` for hierarchy.
3. **Content**: 
   - Convert the body text into clean **Markdown**.
   - Use `#`, `##` for headings.
   - Fix grammar and punctuation errors from the voice input.
   - Use bullet points `-` for lists.
4. **Multiple Entries**: If the input seems to cover multiple distinct topics, split them into separate objects in the array.
5. **Language**: Output in the same language as the input (Japanese).

## Interaction
After outputting the JSON, please ask:
"追加・修正が必要ですか？ それとも次のマニュアルを作成しますか？"
"""

def generate_manual_json(input_text):
    if not api_key:
        print("Error: OPENAI_API_KEY is not set.")
        return None

    client = openai.OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": input_text}
            ],
            temperature=0.3,
        )
        
        content = response.choices[0].message.content
        
        # Robust JSON extraction: Find the first '[' and last ']'
        start_idx = content.find('[')
        end_idx = content.rfind(']')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = content[start_idx : end_idx + 1]
            return json_str
        else:
            print("Error: No JSON array found in response.")
            print("Raw response:", content)
            return None

    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_to_manual.py <input_text_file>")
        print("Or pipe text: echo 'manual text' | python convert_to_manual.py -")
        return

    input_source = sys.argv[1]
    input_text = ""

    if input_source == "-":
        input_text = sys.stdin.read()
    else:
        try:
            with open(input_source, 'r', encoding='utf-8') as f:
                input_text = f.read()
        except FileNotFoundError:
            print(f"File not found: {input_source}")
            return

    if not input_text.strip():
        print("Input text is empty.")
        return

    print("Generating JSON manual from input...")
    json_output = generate_manual_json(input_text)

    if json_output:
        # Save to a file with timestamp
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"manual_import_{timestamp}.json"
        
        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(json_output)
            
        print(f"Success! JSON saved to: {output_filename}")
        print(json_output)
    else:
        print("Failed to generate JSON.")

if __name__ == "__main__":
    main()
