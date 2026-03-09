import React, { useState } from 'react';
import { useStorage } from '../../context/useStorage';
import { parseDocxCourseTable } from '../../utils/docxParser';

export const CourseImporter: React.FC = () => {
  const { setCourses } = useStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const newCourses = await parseDocxCourseTable(arrayBuffer);

      if (newCourses.length === 0) {
        setError('未能从文件中提取到课程，请确保使用的是标准的文字表格格式。');
        return;
      }

      if (window.confirm(`成功提取到 ${newCourses.length} 门课程。是否将其导入并覆盖现有课表？(取消将仅追加)`)) {
        // 覆盖模式
        setCourses(newCourses);
      } else {
        // 追加模式
        setCourses(prev => [...prev, ...newCourses]);
      }
      
      alert('导入成功！');
    } catch (err) {
      console.error(err);
      setError('解析文件时出错，请检查文件格式。');
    } finally {
      setLoading(false);
      // 清空 input 以便允许再次选择同一文件
      event.target.value = '';
    }
  };

  return (
    <div style={{ display: 'inline-block', marginLeft: '10px' }}>
      <input
        type="file"
        id="course-upload"
        accept=".docx"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <label
        htmlFor="course-upload"
        className="btn-primary"
        style={{
          cursor: loading ? 'wait' : 'pointer',
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {loading ? '解析中...' : '导入课表(.docx)'}
      </label>
      {error && (
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          background: '#fee2e2', 
          color: '#ef4444', 
          padding: '10px 20px', 
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
