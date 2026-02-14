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

load_dotenv()

app = FastAPI(title="AIDEN OSINT Agent")

llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

def run_theharvester(query: str) -> str:
    """Run TheHarvester (uses the active venv)."""
    try:
        domain = query.split()[-1]
        cmd = [
            "python",
            "theHarvester.py",
            "-d", domain,
            "-l", "300",
            "-b", "duckduckgo,yahoo,crtsh,dnsdumpster,hackertarget,otx"  # Reliable free sources
        ]
        result = subprocess.run(
            cmd,
            cwd="/home/ben/COMP3000/agent/theHarvester",
            capture_output=True,
            text=True,
            timeout=180,
        )

        if result.returncode != 0:
            return f"Tool error: {result.stderr.strip() or result.stdout.strip() or 'no output'}"

        output = result.stdout.strip()
        return output if output else "TheHarvester ran but found no public data for this domain."

    except Exception as e:
        return f"Execution error: {str(e)}"

osint_tool = Tool(
    name="TheHarvester",
    func=run_theharvester,
    description="Use this to gather real OSINT (emails, hosts, LinkedIn, etc.) for a domain. Always call it with the domain only."
)

# Modern ranking
ranking_prompt = PromptTemplate.from_template(
    "Rank the following OSINT data for a security awareness report:\n"
    "- Accuracy (1-10, based on source credibility)\n"
    "- Usefulness (1-10, for training e.g., phishing risk, data exposure)\n"
    "Explain briefly. Data:\n{data}"
)
ranking_chain = RunnableSequence(ranking_prompt | llm)

# Standard ReAct prompt (this fixes the error)
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

tools = [osint_tool]
agent = create_react_agent(llm=llm, tools=tools, prompt=prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True, max_iterations=6)

class EmployeeInput(BaseModel):
    full_name: str
    email: str
    domain: str

@app.post("/gather_osint")
async def gather_osint(employee: EmployeeInput):
    try:
        query = f"{employee.full_name} {employee.domain}"
        
        agent_result = agent_executor.invoke({
            "input": f"Fetch real OSINT on {employee.full_name} at {employee.domain} for security training."
        })
        raw_results = agent_result["output"]

        # Strong fallback
        if "error" in raw_results.lower() or "no output" in raw_results.lower() or len(raw_results) < 30:
            raw_results = run_theharvester(query)

        ranked = ranking_chain.invoke({"data": raw_results})
        ranked_text = ranked.content if hasattr(ranked, 'content') else str(ranked)

        return {"raw_results": raw_results, "ranked": ranked_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)