/**
 * 模糊记忆录入卡片
 * 只记得大致事件名、时间槽和时长描述 → 三候选快捷录入
 */
import React from 'react';
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
  setSelectedCandidateKey: (key: string) => void;
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
  onAdd,
}) => {
  return (
    <div className={styles.card}>
      <h4>模糊记忆录入（三候选）</h4>
      {/* 事件名 + 添加按钮 */}
      <div className={styles.row}>
        <input
          className={`${styles.input} input-base`}
          list="daily-action-name-list"
          value={fuzzyName}
          onChange={(e) => setFuzzyName(e.target.value)}
          placeholder="只记得事件名也可以快速录入"
        />
        <button className={`${styles.btn} btn-primary`} onClick={onAdd}>
          按候选添加
        </button>
      </div>
      {/* 时段 + 时长描述 */}
      <div className={styles.row}>
        <select
          className={`${styles.select} input-base`}
          value={fuzzySlot}
          onChange={(e) => setFuzzySlot(e.target.value as RoughTimeSlot)}
        >
          {roughTimeSlots.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className={`${styles.select} input-base`}
          value={fuzzyDurationWord}
          onChange={(e) => setFuzzyDurationWord(e.target.value as RoughDurationWord)}
        >
          {roughDurationWords.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
      {/* 三候选按钮 */}
      <div className={styles.candidateList}>
        {fuzzyCandidates.map((c) => (
          <button
            key={c.key}
            className={`${styles.candidate} ${selectedCandidateKey === c.key ? styles.active : ''}`}
            onClick={() => setSelectedCandidateKey(c.key)}
          >
            <b>{c.label}</b>
            <span>
              {Math.floor(c.startMin / 60)}:{String(c.startMin % 60).padStart(2, '0')} · {c.durationMin} 分钟
            </span>
            <small>{c.reason}</small>
          </button>
        ))}
      </div>
    </div>
  );
};
