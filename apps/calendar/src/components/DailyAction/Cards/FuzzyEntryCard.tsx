import React from 'react';
import { fmtHM } from '../../../utils/time';
import type { Candidate, RoughDurationWord, RoughTimeSlot } from '../dailyActionShared';
import { roughDurationWords, roughTimeSlots } from '../dailyActionShared';

type Props = {
  fuzzyName: string;
  setFuzzyName: (value: string) => void;
  fuzzySlot: RoughTimeSlot;
  setFuzzySlot: (value: RoughTimeSlot) => void;
  fuzzyDurationWord: RoughDurationWord;
  setFuzzyDurationWord: (value: RoughDurationWord) => void;
  selectedCandidateKey: string;
  setSelectedCandidateKey: (value: string) => void;
  fuzzyCandidates: Candidate[];
  onAdd: () => void;
};

export const FuzzyEntryCard: React.FC<Props> = ({
  fuzzyName,
  setFuzzyName,
  fuzzySlot,
  setFuzzySlot,
  fuzzyDurationWord,
  setFuzzyDurationWord,
  selectedCandidateKey,
  setSelectedCandidateKey,
  fuzzyCandidates,
  onAdd
}) => {
  return (
    <div className="daily-action-card">
      <h4>模糊记忆录入（三候选）</h4>
      <div className="daily-action-row">
        <input className="daily-action-input" list="daily-action-name-list" value={fuzzyName} onChange={(e) => setFuzzyName(e.target.value)} placeholder="只记得事件名也可以快速录入" />
        <button className="daily-action-btn primary" onClick={onAdd}>按候选添加</button>
      </div>
      <div className="daily-action-row">
        <select className="daily-action-select" value={fuzzySlot} onChange={(e) => setFuzzySlot(e.target.value as RoughTimeSlot)}>
          {roughTimeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
        </select>
        <select className="daily-action-select" value={fuzzyDurationWord} onChange={(e) => setFuzzyDurationWord(e.target.value as RoughDurationWord)}>
          {roughDurationWords.map((word) => <option key={word} value={word}>{word}</option>)}
        </select>
      </div>
      <div className="daily-action-candidate-list">
        {fuzzyCandidates.map((candidate) => {
          const isActive = selectedCandidateKey === candidate.key;
          return (
            <button key={candidate.key} className={`daily-action-candidate ${isActive ? 'active' : ''}`} onClick={() => setSelectedCandidateKey(candidate.key)}>
              <strong>{candidate.label}</strong>
              <span>{fmtHM(candidate.startMin)} - {fmtHM(candidate.startMin + candidate.durationMin)}</span>
              <span>{candidate.durationMin} 分钟 · {candidate.reason}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
