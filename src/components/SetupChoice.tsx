import React from "react";
import { useApp } from "@/context/AppContext";
import { emptyState, seedState } from "@/data/seed";
import { CheckCircle2, ListFilter, Sparkles, Trash2 } from "lucide-react";

export default function SetupChoice() {
  const { dispatch, setNeedsOnboarding } = useApp();

  const handleChoice = (isSeeded: boolean) => {
    const initialState = isSeeded ? seedState : emptyState;
    dispatch({ type: "SET_STATE", state: initialState });
    setNeedsOnboarding(false);
  };

  return (
    <div className="setup-choice-page">
      <div className="setup-container animate-fade-in">
        <div className="setup-header">
          <div className="setup-icon">
            <Sparkles size={32} className="text-accent-light" />
          </div>
          <h1>Welcome to Roadmap!</h1>
          <p>How would you like to start your 2-month job switch journey?</p>
        </div>

        <div className="choice-grid">
          <button onClick={() => handleChoice(true)} className="choice-card">
            <div className="choice-content">
              <div className="choice-badge">Recommended</div>
              <div className="choice-icon-wrap">
                <ListFilter size={24} />
              </div>
              <h3>Seeded Roadmap</h3>
              <p>Get started with pre-filled examples, sample STAR stories, and a structured DSA baseline.</p>
              <ul className="choice-features">
                <li><CheckCircle2 size={14} /> 5 STAR stories included</li>
                <li><CheckCircle2 size={14} /> 10 DSA examples</li>
                <li><CheckCircle2 size={14} /> System design core topics</li>
              </ul>
            </div>
            <div className="choice-action">Start with Seeds</div>
          </button>

          <button onClick={() => handleChoice(false)} className="choice-card secondary">
            <div className="choice-content">
              <div className="choice-icon-wrap">
                <Trash2 size={24} />
              </div>
              <h3>Fresh Start</h3>
              <p>Start with a clean slate. Perfect if you want to enter all your data from scratch.</p>
              <ul className="choice-features">
                <li><CheckCircle2 size={14} /> Clean dashboard</li>
                <li><CheckCircle2 size={14} /> 8-week structure preserved</li>
                <li><CheckCircle2 size={14} /> Empty Story Bank & DSA logs</li>
              </ul>
            </div>
            <div className="choice-action">Start Fresh</div>
          </button>
        </div>
      </div>
    </div>
  );
}
