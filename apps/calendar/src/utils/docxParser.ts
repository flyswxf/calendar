import * as mammoth from 'mammoth/mammoth.browser';
import { Course } from '../types/index';

// 华东师范大学学生课表时间安排 (2026春)
// 包含课间休息时间：
// 第2-3节间休息15分钟 (9:35-9:50)
// 第7-8节间休息15分钟 (14:35-14:50)
// 午休 (12:15-13:00)
// 晚饭 (17:15-18:00)
const SECTION_TIME_MAP: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:50', end: '09:35' },
  3: { start: '09:50', end: '10:35' },
  4: { start: '10:40', end: '11:25' },
  5: { start: '11:30', end: '12:15' },
  6: { start: '13:00', end: '13:45' },
  7: { start: '13:50', end: '14:35' },
  8: { start: '14:50', end: '15:35' },
  9: { start: '15:40', end: '16:25' },
  10: { start: '16:30', end: '17:15' },
  11: { start: '18:00', end: '18:45' },
  12: { start: '18:50', end: '19:35' },
  13: { start: '19:40', end: '20:25' },
  14: { start: '20:30', end: '21:15' },
};

/**
 * 解析课程时间字符串，例如 "(1-4节 8:00-11:25)"
 * 返回开始和结束的节次索引
 */
function parseSectionRange(text: string): { startSection: number; endSection: number } | null {
  // 支持 "1-4节", "1~4节", "第1-4节"
  const match = text.match(/第?(\d+)\s*[-~]\s*(\d+)\s*节/);
  if (match) {
    return {
      startSection: parseInt(match[1]),
      endSection: parseInt(match[2]),
    };
  }
  return null;
}

/**
 * 解析周次字符串，例如 "(1~9周)"
 * 返回周次数组
 */
function parseWeeks(text: string): number[] {
  const weeks: number[] = [];
  
  // 1. 处理逗号分隔的周次，例如 "1-8周,10-17周"
  const parts = text.split(/[,，]/);
  
  parts.forEach(part => {
    // 匹配 "1~9周", "1-17周", "1-17(周)", "1-17"
    // 增加负向先行断言 (?!\s*节)，避免匹配到 "1-4节"
    const rangeMatch = part.match(/(\d+)\s*[-~]\s*(\d+)(?:\s*周)?(?!\s*节)/);
    
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      
      // 简单的合理性检查：周数通常在 1-30 之间
      if (start > 0 && end <= 30) {
        // 检查是否有单双周标记
        const isOdd = part.includes('单');
        const isEven = part.includes('双');
        
        for (let i = start; i <= end; i++) {
          if (isOdd && i % 2 === 0) continue;
          if (isEven && i % 2 !== 0) continue;
          weeks.push(i);
        }
      }
    } else {
      // 简单匹配单个数字 "5周"
      const simpleMatch = part.match(/(\d+)\s*周/);
      if (simpleMatch) {
         weeks.push(parseInt(simpleMatch[1]));
      }
    }
  });
  
  return Array.from(new Set(weeks)).sort((a, b) => a - b);
}

/**
 * 清理课程信息文本，去除节次、周次、时间、括号等干扰信息
 */
function cleanCourseInfo(text: string): string {
  return text
    .replace(/第?(\d+)\s*[-~–—]\s*(\d+)\s*节/g, '') // 去掉节次，支持多种连字符
    .replace(/(\d+)\s*[-~–—]\s*(\d+)(?:\s*周)?(?!\s*节)/g, '') // 去掉周次范围
    .replace(/(\d+)\s*周/g, '') // 去掉单周
    // 去掉时间范围 (8:00-9:00)，支持多种连字符、空格、双冒号等奇怪格式
    .replace(/\d{1,2}\s*[:：]{1,2}\s*\d{2}\s*[-~–—]\s*\d{1,2}\s*[:：]{1,2}\s*\d{2}/g, '')
    // 去掉单独的时间 (8:00, 8::00)，支持空格、双冒号
    .replace(/\d{1,2}\s*[:：]{1,2}\s*\d{2}/g, '')
    // 去掉残留的连字符或冒号（如果是单独存在的）
    .replace(/^\s*[-~–—:：]+\s*/, '')
    .replace(/[()（）[\]【】〔〕]/g, ' ') // 去掉括号，支持多种括号
    .trim();
}

/**
 * 解析单个 .docx 文件
 */
export async function parseDocxCourseTable(arrayBuffer: ArrayBuffer): Promise<Course[]> {
  // 使用 convertToHtml 获取 HTML 结构，以便解析表格
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = Array.from(doc.querySelectorAll('table'));

  const courses: Course[] = [];
  
  // 寻找包含“星期一”的表格
  const targetTable = tables.find(table => table.textContent?.includes('星期一'));

  if (!targetTable) {
    console.warn("未找到符合结构的课表表格");
    return [];
  }

  const rows = Array.from(targetTable.querySelectorAll('tr'));
  
  // 构建 grid 来处理 rowspan/colspan
  // grid[row][col] = cell element
  const grid: (HTMLTableCellElement | null)[][] = [];
  
  // 第一步：填充 grid
  rows.forEach((row, rowIndex) => {
    if (!grid[rowIndex]) grid[rowIndex] = [];
    
    let colIndex = 0;
    const cells = Array.from(row.querySelectorAll('td'));
    
    cells.forEach((cell) => {
      // 找到当前行第一个空位
      while (grid[rowIndex][colIndex]) {
        colIndex++;
      }
      
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
      const colspan = parseInt(cell.getAttribute('colspan') || '1');
      
      for (let r = 0; r < rowspan; r++) {
        for (let c = 0; c < colspan; c++) {
          const targetRow = rowIndex + r;
          if (!grid[targetRow]) grid[targetRow] = [];
          grid[targetRow][colIndex + c] = cell;
        }
      }
      // 移动 colIndex
      colIndex += colspan; 
    });
  });

  // 第二步：确定表头行和列索引映射
  let headerRowIndex = -1;
  const dayColMap: Record<number, number> = {}; // colIndex -> day (1-7)

  // 遍历前几行寻找表头
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const rowText = rows[r]?.textContent || '';
    if (rowText.includes('星期一')) {
      headerRowIndex = r;
      // 检查这一行的每一列
      // 注意：grid[r] 包含了所有列的 cell
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        const cellText = cell?.textContent || '';
        
        if (cellText.includes('星期一')) dayColMap[c] = 1;
        else if (cellText.includes('星期二')) dayColMap[c] = 2;
        else if (cellText.includes('星期三')) dayColMap[c] = 3;
        else if (cellText.includes('星期四')) dayColMap[c] = 4;
        else if (cellText.includes('星期五')) dayColMap[c] = 5;
        else if (cellText.includes('星期六')) dayColMap[c] = 6;
        else if (cellText.includes('星期日')) dayColMap[c] = 7;
      }
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn("未找到表头行");
    return [];
  }

  // 第三步：遍历数据区域提取课程
  const processedCells = new Set<HTMLTableCellElement>();

  for (let r = headerRowIndex + 1; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (!cell || processedCells.has(cell)) continue;
      
      const day = dayColMap[c];
      if (!day) continue; // 这一列不是星期几

      // 标记为已处理，避免重复解析同一个跨行单元格
      processedCells.add(cell);

      // 提取文本行
      let lines: string[] = [];
      const paragraphs = Array.from(cell.querySelectorAll('p'));
      if (paragraphs.length > 0) {
        lines = paragraphs.map(p => p.textContent?.trim() || '').filter(l => l);
      } else {
        // 兜底：直接分割文本
        lines = (cell.innerText || cell.textContent || '').split(/\n+/).map(l => l.trim()).filter(l => l);
      }

      // 解析课程块
      // 一个单元格可能包含多个课程，通常由“节次”信息分隔
      // 策略：遍历每一行，找到包含“x-y节”的行作为锚点
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const sectionRange = parseSectionRange(line);

        if (sectionRange) {
          // 找到了时间锚点！
          // 1. 解析周次（通常在同一行或附近）
          const weeks = parseWeeks(line);
          // 如果当前行没找到周次，尝试在上一行或下一行找？通常周次和节次在一起
          // 这里的 parseWeeks 已经比较鲁棒，能处理 "1-17周"

          // 2. 解析课程名称
          // 通常在时间行的上方
          // 向上回溯，跳过“教学班代码”等无关信息
          let title = '未命名课程';
          for (let j = i - 1; j >= 0; j--) {
            const prevLine = lines[j];
            // 跳过已知的元数据行
            if (prevLine.includes('教学班代码') || prevLine.includes('周)') || parseSectionRange(prevLine)) {
               continue;
            }
            // 找到第一个看起来像标题的行
            // 假设标题不包含大量的数字
            title = prevLine;
            break;
          }

          // 3. 解析地点和教师
          // 通常在时间行的下方，或者是时间行的一部分（去除时间周次后）
          // 或者是单独的一行
          
          let location = '';
          let teacher = '';
          
          // 尝试从当前行提取剩余信息
          const remainingText = cleanCourseInfo(line);
            
          // 如果当前行剩余文本太短，可能地点和教师在下一行
          let extraInfoLine = '';
          if (remainingText.length < 2 && i + 1 < lines.length) {
             // 检查下一行是否是新的课程块（包含节次）
             if (!parseSectionRange(lines[i+1])) {
                extraInfoLine = cleanCourseInfo(lines[i+1]);
             }
          }
          
          const infoText = (remainingText + ' ' + extraInfoLine).trim();
          
          // 简单的启发式规则：
          // 教师通常是 2-3 个字，或者是中文名
          // 地点通常包含数字、楼、室、校区
          const parts = infoText.split(/\s+/).filter(p => p);
          
          if (parts.length > 1) {
             const lastPart = parts[parts.length - 1];
             // 教师名字通常是2-4个汉字，且不包含“楼、室、馆、院、区”等地点关键词
             // 或者如果 lastPart 包含在原来的括号里（现在已经去除括号），但我们通过 cleanCourseInfo 
             // 很难知道它原来是否在括号里。
             // 我们可以放宽条件：如果它看起来像人名（2-4汉字），且不含数字和地点词
             if (/^[\u4e00-\u9fa5]{2,4}$/.test(lastPart) && !/[楼室馆院区]/.test(lastPart) && !/\d/.test(lastPart)) { 
                teacher = lastPart;
                location = parts.slice(0, parts.length - 1).join(' ');
             } else {
                // 如果最后一个部分看起来像时间（如 8::25），则丢弃它
                if (/^\d+[:：]+\d+$/.test(lastPart) || /^[:：]+$/.test(lastPart)) {
                    location = parts.slice(0, parts.length - 1).join(' ');
                } else {
                    location = parts.join(' ');
                }
             }
          } else if (parts.length === 1) {
             const text = parts[0];
             // 如果只剩下一个部分，且看起来像时间或乱码，直接丢弃
             if (/^[:：\d]+$/.test(text)) {
                location = ''; // 无效信息
             } else {
                // 尝试从末尾分离教师名（如果连在一起，如“理科大楼B226张三”）
                // 匹配末尾2-3个汉字
                const match = text.match(/^(.*)([\u4e00-\u9fa5]{2,3})$/);
                if (match) {
                    const potentialLocation = match[1];
                    const potentialTeacher = match[2];
                    
                    // 验证分离出来的“教师”不包含数字或地点关键词
                    if (!/[0-9]/.test(potentialTeacher) && !/[楼室馆院区]/.test(potentialTeacher)) {
                       location = potentialLocation;
                       teacher = potentialTeacher;
                    } else {
                       location = text;
                    }
                } else {
                    location = text;
                }
             }
          }
          
          // 二次清理 location 中的残留时间字符
          if (location) {
             location = location.replace(/^\d+[:：]+\d+\s*/, '').replace(/^\s*[:：]+\s*/, '');
          }

          if (!location) location = '未知地点';

          const { startSection, endSection } = sectionRange;
          const startTime = SECTION_TIME_MAP[startSection]?.start || '08:00';
          const endTime = SECTION_TIME_MAP[endSection]?.end || '09:35';

          courses.push({
            id: Math.random().toString(36).substr(2, 9),
            title,
            day,
            start: startTime,
            end: endTime,
            location,
            teacher,
            weeks: weeks.length > 0 ? weeks : undefined
          });
        }
      }
    }
  }

  return courses;
}
