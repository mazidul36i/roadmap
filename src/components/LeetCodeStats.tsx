import React, { useState, useEffect } from "react";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { useApp, uid } from "@context/AppContext";

const TOPICS = [
  "Arrays", "Strings", "Hashmaps", "Stack", "Queue", "Linked List", 
  "Trees", "BST", "Graphs", "Heap", "Binary Search", "Two Pointer", 
  "Sliding Window", "Dynamic Programming", "Backtracking", "Trie", 
  "Greedy", "Math"
];

const TOPIC_MAP: Record<string, string> = {
  "Array": "Arrays",
  "String": "Strings",
  "Hash Table": "Hashmaps",
  "Binary Tree": "Trees",
  "Tree": "Trees",
  "Binary Search Tree": "BST",
  "Graph": "Graphs",
  "Depth-First Search": "Graphs",
  "Breadth-First Search": "Graphs",
  "Union Find": "Graphs",
  "Priority Queue": "Heap",
  "Two Pointers": "Two Pointer",
};

interface LeetCodeStatsProps {
  username: string;
}

export default function LeetCodeStats({ username }: LeetCodeStatsProps) {
  const { state, dispatch } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setError(null);
      try {
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load LeetCode stats");
      } finally {
        setLoadingStats(false);
      }
    };
    
    if (username) {
      fetchStats();
    }
  }, [username]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/acSubmission`);
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      
      const submissions = data.submission || [];
      
      // Filter out existing problems
      const existingUrls = new Set(state.dsaProblems.map(p => p.url));
      const existingNames = new Set(state.dsaProblems.map(p => p.name.toLowerCase()));
      
      const newSubmissions: any[] = [];
      for (const sub of submissions) {
        const url = `https://leetcode.com/problems/${sub.titleSlug}/`;
        if (!existingUrls.has(url) && !existingNames.has(sub.title.toLowerCase())) {
          newSubmissions.push(sub);
        }
      }

      // Max 5 recent, unique new submissions
      // Remove duplicates from the new submissions based on titleSlug
      const uniqueNewSubmissions: any[] = [];
      const seenSlugs = new Set();
      for (const sub of newSubmissions) {
        if (!seenSlugs.has(sub.titleSlug)) {
          seenSlugs.add(sub.titleSlug);
          uniqueNewSubmissions.push(sub);
        }
      }

      const toProcess = uniqueNewSubmissions.slice(0, 5).reverse();

      if (toProcess.length === 0) {
        alert("Tracker is already up-to-date! No new submissions found.");
        setSyncing(false);
        return;
      }

      let successCount = 0;
      let newStats = { ...stats };

      for (const sub of toProcess) {
        try {
          const detailRes = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${sub.titleSlug}`);
          if (!detailRes.ok) continue;
          const detailData = await detailRes.json();
          
          let mappedTopics: string[] = [];
          if (detailData.topicTags && detailData.topicTags.length > 0) {
            mappedTopics = detailData.topicTags
              .map((t: any) => TOPIC_MAP[t.name] || TOPICS.find(topic =>
                topic.toLowerCase().includes(t.name.toLowerCase()) ||
                t.name.toLowerCase().includes(topic.toLowerCase().replace(/s$/, ""))
              ))
              .filter(Boolean);
          }
          
          const finalTopics = Array.from(new Set(mappedTopics));
          if (finalTopics.length === 0) finalTopics.push("Arrays");

          const difficulty = detailData.difficulty || "Medium";

          if (difficulty === "Easy") newStats.easySolved = (newStats.easySolved || 0) + 1;
          else if (difficulty === "Medium") newStats.mediumSolved = (newStats.mediumSolved || 0) + 1;
          else if (difficulty === "Hard") newStats.hardSolved = (newStats.hardSolved || 0) + 1;
          newStats.totalSolved = (newStats.totalSolved || 0) + 1;

          dispatch({
            type: "ADD_DSA",
            problem: {
              id: uid(),
              name: detailData.questionTitle || sub.title,
              topics: finalTopics,
              difficulty: difficulty as any,
              platform: "LeetCode",
              solved: true,
              timeTaken: 0,
              pattern: "",
              mistakes: "",
              url: `https://leetcode.com/problems/${sub.titleSlug}/`
            }
          });
          successCount++;
        } catch (e) {
          console.error("Failed to process submission:", sub.title, e);
        }
      }
      
      if (successCount > 0) {
        setStats(newStats);
      }
      
      alert(`Successfully synced ${successCount} new problem(s)!`);
    } catch (e: any) {
      alert(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loadingStats) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Loader2 className="animate-spin" size={14} style={{ color: "var(--accent)" }} />
        Loading LeetCode stats...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontSize: "0.85rem", color: "var(--danger)" }}>
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex items-center" style={{ justifyContent: "space-between", width: "100%", background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: "0.9rem" }}>
          LeetCode Linked
          <a href={`https://leetcode.com/${username}`} target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", display: "flex" }}>
            <ExternalLink size={14} />
          </a>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Ranking: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{stats.ranking ? stats.ranking.toLocaleString() : 'N/A'}</span>
        </div>
      </div>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={handleSync} 
        disabled={syncing}
        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
      >
        {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        {syncing ? "Syncing..." : "Sync Recent"}
      </button>
    </div>
  );
}
