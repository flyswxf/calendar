import React, { useState } from 'react';
import { useStorage } from '../../context/StorageContext';
import { parseHM } from '../../utils/time';
import styles from './CourseModal.module.css';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose }) => {
  const { courses, setCourses } = useStorage();

  const [title, setTitle] = useState('');
  const [day, setDay] = useState(1);
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('09:40');
  const [location, setLocation] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !start || !end) return;
    if (parseHM(end) <= parseHM(start)) {
      alert('结束时间必须晚于开始时间');
      return;
    }

    const newCourse = {
      id: crypto.randomUUID(),
      title: title.trim(),
      day,
      start,
      end,
      location: location.trim()
    };

    setCourses([...courses, newCourse]);
    onClose();
    setTitle('');
    setLocation('');
  };

  return (
    <div className={styles.modal} aria-hidden="false" style={{ display: 'flex' }}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3>添加课程</h3>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          <label>
            课程名称
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：高等数学"
            />
          </label>
          <label>
            上课日
            <select value={day} onChange={e => setDay(Number(e.target.value))}>
              <option value="1">周一</option>
              <option value="2">周二</option>
              <option value="3">周三</option>
              <option value="4">周四</option>
              <option value="5">周五</option>
              <option value="6">周六</option>
              <option value="0">周日</option>
            </select>
          </label>
          <div className="time-range">
            <label>
              开始
              <input type="time" value={start} onChange={e => setStart(e.target.value)} />
            </label>
            <label>
              结束
              <input type="time" value={end} onChange={e => setEnd(e.target.value)} />
            </label>
          </div>
          <label>
            教室
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="例如：3-201"
            />
          </label>
        </div>
        <div className={styles.actions}>
          <button onClick={onClose}>取消</button>
          <button onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
};
