import React from 'react';
import { pieColors } from '../dailyActionShared';

type SummaryRow = {
  name: string;
  durationMin: number;
};

type Props = {
  pieGradient: string;
  rows: SummaryRow[];
  total: number;
};

export const SummaryCard: React.FC<Props> = ({ pieGradient, rows, total }) => {
  return (
    <div className="daily-action-card">
      <h4>今日时间分配</h4>
      <div className="daily-action-chart-wrap">
        <div className="daily-action-pie" style={{ background: pieGradient }} />
        <div className="daily-action-legend">
          {rows.length === 0 && <span className="daily-action-muted">今天还没有事件记录</span>}
          {rows.map((item, index) => {
            const ratio = total > 0 ? Math.round((item.durationMin / total) * 100) : 0;
            return (
              <div key={item.name} className="daily-action-legend-item">
                <i style={{ background: pieColors[index % pieColors.length] }} />
                <span>{item.name}</span>
                <b>{item.durationMin} 分钟（{ratio}%）</b>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
