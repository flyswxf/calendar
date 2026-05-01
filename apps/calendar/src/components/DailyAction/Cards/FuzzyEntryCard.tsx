import React from 'react';
import { fmtHM } from '../../../utils/time';
import type { Candidate, RoughDurationWord, RoughTimeSlot } from '../dailyActionShared';
import { roughDurationWords, roughTimeSlots } from '../dailyActionShared';
import styles from '../DailyActionPanel.module.css';

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
    <div className={styles.card}>
      <h4>模糊记忆录入（三候选）</h4>
      <div className={styles.row}>
        <input className={styles.input} list="daily-action-name-list" value={fuzzyName} onChange={(e) => setFuzzyName(e.target.value)} placeholder="只记得事件名也可以快速录入" />
        <button className={`${styles.btn} ${styles.primary}`} onClick={onAdd}>按候选添加</button>
      </div>
      <div className={styles.row}>
        <select className={styles.select} value={fuzzySlot} onChange={(e) => setFuzzySlot(e.target.value as RoughTimeSlot)}>
          {roughTimeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
        </select>
        <select className={styles.select} value={fuzzyDurationWord} onChange={(e) => setFuzzyDurationWord(e.target.value as RoughDurationWord)}>
          {roughDurationWords.map((word) => <option key={word} value={word}>{word}</option>)}
        </select>
      </div>
      <div className={styles.candidateList}>
        {fuzzyCandidates.map((candidate) => {
          const isActive = selectedCandidateKey === candidate.key;
          return (
            <button key={candidate.key} className={`${styles.candidate} ${isActive ? styles.active : ''}`} onClick={() => setSelectedCandidateKey(candidate.key)}>
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
