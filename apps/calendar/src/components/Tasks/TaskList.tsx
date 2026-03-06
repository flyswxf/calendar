import React, { useState } from 'react';
import { useStorage } from '../../context/StorageContext';
import { useTimer } from '../../context/TimerContext';
import clsx from 'clsx';

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
      isLegacy: false
    };
    setTasks([...tasks, newTask]);
    setInputValue('');
  };

  const handleToggle = (id: string) => {
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(newTasks);
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="todo-section">
      <h2>待办事项</h2>
      <div className="todo-input">
        <input 
          id="taskInput"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入新的待办事项..."
        />
        <button id="addTask" onClick={handleAdd}>添加</button>
      </div>
      <ul id="taskList" className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={clsx('task-item', { completed: task.completed, legacy: task.isLegacy })}>
            <input 
              type="checkbox" 
              className="task-checkbox"
              checked={task.completed}
              onChange={() => handleToggle(task.id)}
            />
            <span className="task-text">
              {task.isLegacy ? `[遗留] ${task.text}` : task.text}
            </span>
            <button className="focus-btn" onClick={() => openTimer(task)}>开始专注</button>
            <button className="delete-btn" onClick={() => handleDelete(task.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
