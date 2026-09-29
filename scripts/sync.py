"""Build public dashboard JSON from Azure DevOps and GitHub. No third-party packages."""
import base64
import datetime as dt
import json
import os
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "data" / "dashboard.json"
ORG = os.getenv("ADO_ORG", "franciscorangelb")
PROJECT = os.getenv("ADO_PROJECT", "Dashboard for tickets")
OWNER = os.getenv("GITHUB_REPOSITORY_OWNER", "FrankRan23")
REPO = os.getenv("GITHUB_REPOSITORY", "FrankRan23/TestBoardADO").split("/")[-1]
PAT = os.getenv("AZURE_DEVOPS_PAT", "").strip()


def fetch(url, *, method="GET", body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"Accept": "application/json", "User-Agent": "BoardADO/1.0", **(headers or {})})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=35) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 502, 503, 504) or attempt == 4:
                raise RuntimeError(f"{url.split('?')[0]}: HTTP {exc.code}") from None
        except (urllib.error.URLError, TimeoutError, ConnectionResetError):
            if attempt == 4:
                raise
        time.sleep(min(2 ** attempt, 8))


def azure_items():
    if not PAT:
        return None
    base = f"https://dev.azure.com/{urllib.parse.quote(ORG)}/{urllib.parse.quote(PROJECT)}/_apis/wit"
    headers = {"Authorization": "Basic " + base64.b64encode((":" + PAT).encode()).decode(), "Content-Type": "application/json"}
    # Only explicitly tagged demo items go into the public Pages artifact.
    query = {"query": "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.Tags] CONTAINS 'dashboard-demo' ORDER BY [System.ChangedDate] DESC"}
    result = fetch(base + "/wiql?api-version=7.1", method="POST", body=query, headers=headers)
    ids = [x["id"] for x in result.get("workItems", [])]
    fields = "System.Id,System.Title,System.State,System.WorkItemType,System.ChangedDate,System.CreatedDate,System.Tags,System.Parent,Microsoft.VSTS.Common.Priority,Microsoft.VSTS.Scheduling.StoryPoints,Microsoft.VSTS.Scheduling.OriginalEstimate,Microsoft.VSTS.Scheduling.RemainingWork,Microsoft.VSTS.Scheduling.CompletedWork"
    items = []
    for start in range(0, len(ids), 200):
        chunk = ",".join(map(str, ids[start:start + 200]))
        url = base + "/workitems?" + urllib.parse.urlencode({"ids": chunk, "fields": fields, "api-version": "7.1"})
        for work in fetch(url, headers=headers).get("value", []):
            f = work["fields"]
            items.append({"id": work["id"], "source": "Azure DevOps", "title": f.get("System.Title", ""),
                          "type": f.get("System.WorkItemType", ""), "state": f.get("System.State", ""),
                          "priority": f.get("Microsoft.VSTS.Common.Priority"), "parentId": f.get("System.Parent"),
                          "storyPoints": f.get("Microsoft.VSTS.Scheduling.StoryPoints"),
                          "originalEstimate": f.get("Microsoft.VSTS.Scheduling.OriginalEstimate"),
                          "remainingWork": f.get("Microsoft.VSTS.Scheduling.RemainingWork"),
                          "completedWork": f.get("Microsoft.VSTS.Scheduling.CompletedWork"),
                          "tags": f.get("System.Tags", ""), "createdAt": f.get("System.CreatedDate"),
                          "changedAt": f.get("System.ChangedDate"),
                          "url": f"https://dev.azure.com/{ORG}/{urllib.parse.quote(PROJECT)}/_workitems/edit/{work['id']}"})
    return items


def github_items():
    token = os.getenv("GITHUB_TOKEN", "")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    result = fetch(f"https://api.github.com/repos/{OWNER}/{REPO}/issues?state=all&per_page=100", headers=headers)
    return [{"id": x["number"], "source": "GitHub", "type": "Pull Request" if "pull_request" in x else "Issue",
             "title": x["title"], "state": "Closed" if x["state"] == "closed" else "Active",
             "priority": None, "createdAt": x["created_at"], "changedAt": x["updated_at"], "url": x["html_url"]} for x in result]


def main():
    current = json.loads(OUTPUT.read_text(encoding="utf-8"))
    ado = azure_items()
    gh = github_items()
    if ado is None:
        # Keep the starter view until ADO credentials are configured.
        ado = [x for x in current["items"] if x["source"] == "Azure DevOps"]
    data = {"generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "mode": "demo" if not PAT else "live",
            "sources": {"azureDevOps": "demo" if not PAT else "live", "github": "live"},
            "items": ado + gh}
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(ado)} Azure DevOps and {len(gh)} GitHub items")


if __name__ == "__main__":
    main()
