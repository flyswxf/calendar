/**
 * 今日时间分配概览卡片
 * 饼图 + 各事件耗时图例
 */
import React from 'react';
import { pieColors } from '../dailyActionShared';
import styles from '../DailyActionPanel.module.css';

type SummaryRow = { name: string; durationMin: number };

type Props = {
  pieGradient: string;
  rows: SummaryRow[];
  total: number;
};

export const SummaryCard: React.FC<Props> = ({ pieGradient, rows, total }) => {
  return (
    <div className={styles.card}>
      <h4>今日时间分配</h4>
      <div className={styles.chartWrap}>
        <div className={styles.pie} style={{ background: pieGradient }} />
        <div className={styles.legend}>
          {rows.length === 0 && <span className={styles.muted}>今天还没有事件记录</span>}
          {rows.map((item, i) => {
            const ratio = total > 0 ? Math.round((item.durationMin / total) * 100) : 0;
            return (
              <div key={item.name} className={styles.legendItem}>
                <i style={{ background: pieColors[i % pieColors.length] }} />
                <span>{item.name}</span>
                <b>
                  {item.durationMin} 分钟（{ratio}%）
                </b>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
