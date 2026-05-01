/**
 * 待办任务列表
 * CRUD 操作 + 专注按钮集成
 */
import React, { useState } from 'react';
import { useStorage } from '../../context/StorageContext';
import { useTimer } from '../../context/TimerContext';
import clsx from 'clsx';
import styles from './TaskList.module.css';

export const TaskList: React.FC = () => {
  const { tasks, setTasks } = useStorage();
  const { openTimer } = useTimer();
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newTask = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
      isLegacy: false,
    };
    setTasks([...tasks, newTask]);
    setInputValue('');
  };

  const handleToggle = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className={styles.section}>
      <h2>待办事项</h2>
      <div className={styles.inputRow}>
        <input
          className={`${styles.input} input-base`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入新的待办事项..."
        />
        <button className={`${styles.addBtn} btn-primary`} onClick={handleAdd}>
          添加
        </button>
      </div>
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li
            key={task.id}
            className={clsx(styles.item, task.completed && styles.completed, task.isLegacy && styles.legacy)}
          >
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={task.completed}
              onChange={() => handleToggle(task.id)}
            />
            <span className={styles.text}>{task.text}</span>
            {!task.completed && (
              <button className={styles.focusBtn} onClick={() => openTimer(task)}>
                专注
              </button>
            )}
            <button className={styles.deleteBtn} onClick={() => handleDelete(task.id)}>
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
