from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool
from langchain_classic.agents import create_react_agent, AgentExecutor
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
from dotenv import load_dotenv
import subprocess
import os
import json

load_dotenv()

app = FastAPI(title="AIDEN OSINT Agent")

llm = ChatOpenAI(model="gpt-4o", temperature=0.3)

# ==================== TOOLS ====================

def run_theharvester(domain: str) -> str:
    try:
        cmd = ["python", "theHarvester.py", "-d", domain, "-l", "300", "-b", "duckduckgo,yahoo,crtsh,dnsdumpster,hackertarget,otx,linkedin"]
        result = subprocess.run(cmd, cwd="/home/ben/COMP3000/agent/theHarvester", capture_output=True, text=True, timeout=180)
        return result.stdout.strip() or "No domain data found."
    except Exception as e:
        return f"TheHarvester error: {str(e)}"

def run_sherlock(name: str) -> str:
    """Smart multi-variation Sherlock - fast & effective."""
    try:
        parts = name.lower().split()
        first = parts[0]
        last = parts[-1]
        base = first + last

        variations = [
            base, base + "official", first + "." + last, first + "_" + last,
            first[:1] + last, last + first, base[:10], base + "hq",
            first + last[:4], base.replace(" ", ""), first + last[0]
        ]

        results = []
        for username in variations[:8]:
            cmd = ["sherlock", username, "--timeout", "10", "--print-found", "--no-color"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
            if "[+]" in result.stdout:
                results.append(f"→ {username}\n{result.stdout.strip()}\n")

        return "\n".join(results) if results else f"No major accounts found for '{name}'"

    except Exception as e:
        return f"Sherlock error: {str(e)}"

def run_haveibeenpwned(email: str) -> str:
    try:
        import requests
        headers = {"hibp-api-key": os.getenv("HIBP_API_KEY"), "User-Agent": "AIDEN-OSINT-Agent"}
        r = requests.get(f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}", headers=headers, timeout=15)
        if r.status_code == 200:
            breaches = [b['Name'] for b in r.json()]
            return f"Found in {len(breaches)} breaches: {', '.join(breaches[:12])}"
        elif r.status_code == 404:
            return "Email not found in any known breaches."
        else:
            return f"HIBP error: {r.status_code}"
    except Exception as e:
        return f"Breaches check error: {str(e)}"

theharvester_tool = Tool(name="TheHarvester", func=run_theharvester, description="Domain OSINT (emails, hosts, subdomains). Input: domain.")
sherlock_tool = Tool(name="Sherlock", func=run_sherlock, description="Username search across social networks. Input: full name.")
hibp_tool = Tool(name="HaveIBeenPwned", func=run_haveibeenpwned, description="Check email for data breaches. Input: email.")

tools = [theharvester_tool, sherlock_tool, hibp_tool]

# ==================== RANKING ====================
ranking_prompt = PromptTemplate.from_template(
    """You are a security awareness expert. Return **ONLY** valid JSON. No markdown, no code blocks, no extra text.

Return this exact structure:
{{
  "accuracy": <integer 1-10>,
  "usefulness": <integer 1-10>,
  "risk_level": "Low" or "Medium" or "High" or "Critical",
  "key_findings": ["short bullet 1", "short bullet 2", ...],
  "training_recommendations": ["specific training idea 1", "specific training idea 2", ...]
}}

Data:
{data}"""
)

ranking_chain = RunnableSequence(ranking_prompt | llm)

# ==================== PHISHING EMAIL GENERATION ====================
phishing_llm = ChatOpenAI(model="gpt-4o", temperature=0.1, response_format={"type": "json_object"})

phishing_prompt = PromptTemplate.from_template(
    """You are a cybersecurity expert simulating a spear-phishing attack for training purposes only. Do not include any disclaimers in the email itself.

Using the following OSINT data about {full_name} ({email}):

{osint_data}

Generate a highly personalized, realistic spear-phishing email that an attacker might send. Tailor it to the employee's interests, role, or findings from the OSINT (e.g., reference social media, recent events, or personal details).

Respond with a valid JSON object containing:
{{
  "subject": "Compelling subject line",
  "from_name": "Spoofed sender name (e.g., a colleague or trusted contact)",
  "from_email": "Spoofed email address",
  "body": "Full email body in HTML format (include links, attachments if relevant, but keep safe for demo)",
  "explanation": "Brief explanation (2-3 sentences) of why this email is effective based on the OSINT data, for training purposes."
}}"""
)

phishing_chain = RunnableSequence(phishing_prompt | phishing_llm)

class PhishingInput(BaseModel):
    full_name: str
    email: str
    osint_data: str

@app.post("/generate_phishing")
async def generate_phishing(input: PhishingInput):
    try:
        result = phishing_chain.invoke({
            "full_name": input.full_name,
            "email": input.email,
            "osint_data": input.osint_data[:4000]  # Truncate if too long to avoid token limits
        })
        # Parse the JSON from content
        content = result.content.strip()
        if not content:
            raise ValueError("Empty response from LLM")
        phishing_json = json.loads(content)
        return phishing_json
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Phishing generation error: Invalid JSON from LLM - {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Phishing generation error: {str(e)}")

# ==================== AGENT ====================

prompt = PromptTemplate.from_template(
    """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought: {agent_scratchpad}"""
)

agent = create_react_agent(llm=llm, tools=tools, prompt=prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=10, return_intermediate_steps=True)

# ==================== ENDPOINT ====================

class EmployeeInput(BaseModel):
    full_name: str
    email: str
    domain: str

@app.post("/gather_osint")
async def gather_osint(employee: EmployeeInput):
    try:
        agent_result = agent_executor.invoke({
            "input": f"Perform full OSINT on {employee.full_name} ({employee.email}) at {employee.domain} for security awareness training."
        })

        intermediate_steps = agent_result.get("intermediate_steps", [])
        trace_parts = []
        for action, obs in intermediate_steps:
            trace_parts.append(action.log)
            trace_parts.append(f"Observation: {obs}")
        trace_parts.append(f"Final Answer: {agent_result['output']}")
        raw_results = "\n\n".join(trace_parts)

        ranked = ranking_chain.invoke({"data": raw_results})
        ranked_text = ranked.content.strip()

        return {"raw_results": raw_results, "ranked": ranked_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)