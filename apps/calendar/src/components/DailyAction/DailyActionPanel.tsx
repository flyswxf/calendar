/**
 * 今日行动记录面板
 * 组装 Manual / Running / Fuzzy / Summary / EventList 五个卡片
 */
import React from 'react';
import {
  EventListCard,
  FuzzyEntryCard,
  ManualEntryCard,
  RunningSessionCard,
  SummaryCard,
} from './Cards/index';
import { useDailyActionPanel } from './useDailyActionPanel';
import styles from './DailyActionPanel.module.css';

export const DailyActionPanel: React.FC = () => {
  const vm = useDailyActionPanel();

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3>今日行动记录</h3>
        <p>{vm.todayKey} · 记录今天发生的事件并复盘时间分配</p>
      </div>

      {/* 五个功能卡片 */}
      <ManualEntryCard
        manualName={vm.manualName}
        setManualName={vm.setManualName}
        manualHour={vm.manualHour}
        setManualHour={vm.setManualHour}
        manualMinute={vm.manualMinute}
        setManualMinute={vm.setManualMinute}
        manualDurationMin={vm.manualDurationMin}
        setManualDurationMin={vm.setManualDurationMin}
        onAdd={vm.handleAddManual}
      />
      <RunningSessionCard
        runningName={vm.runningName}
        setRunningName={vm.setRunningName}
        activeSession={vm.activeSession}
        adjustEndHour={vm.adjustEndHour}
        setAdjustEndHour={vm.setAdjustEndHour}
        adjustEndMinute={vm.adjustEndMinute}
        setAdjustEndMinute={vm.setAdjustEndMinute}
        onStart={vm.handleStartSession}
        onEnd={vm.handleEndSession}
      />
      <FuzzyEntryCard
        fuzzyName={vm.fuzzyName}
        setFuzzyName={vm.setFuzzyName}
        fuzzySlot={vm.fuzzySlot}
        setFuzzySlot={vm.setFuzzySlot}
        fuzzyDurationWord={vm.fuzzyDurationWord}
        setFuzzyDurationWord={vm.setFuzzyDurationWord}
        selectedCandidateKey={vm.selectedCandidateKey}
        setSelectedCandidateKey={vm.setSelectedCandidateKey}
        fuzzyCandidates={vm.fuzzyCandidates}
        onAdd={vm.handleAddFromCandidate}
      />
      <SummaryCard pieGradient={vm.pieGradient} rows={vm.summaryItems.rows} total={vm.summaryItems.total} />
      <EventListCard
        now={vm.now}
        todayEvents={vm.todayEvents}
        editDraft={vm.editDraft}
        setEditDraft={vm.setEditDraft}
        onSaveEdit={vm.handleSaveEdit}
        onStartEdit={vm.handleStartEdit}
        onDelete={vm.handleDelete}
      />

      {/* 事件名候选列表 */}
      <datalist id="daily-action-name-list">
        {vm.nameSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </section>
  );
};
