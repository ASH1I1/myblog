/**
 * 装饰性几何元素（纯装饰，全部 aria-hidden）。
 * 用于个人展示板块：像素方块、波浪线、加号、点状圆环。
 */

const DEFAULT_COLORS = ["#ff6b4a", "#f59e0b", "#7c5cff", "#14b8a6", "#ec4899", "#3b82f6"];

/** 点亮像素格的位置与颜色槽位 [x, y, colorIndex]（5x5 网格） */
const CELLS: Array<[number, number, number]> = [
  [0, 0, 0], [2, 0, 1], [4, 0, 2],
  [1, 1, 3], [3, 1, 0],
  [0, 2, 4], [2, 2, 5], [4, 2, 1],
  [1, 3, 2], [3, 3, 3],
  [0, 4, 0], [2, 4, 1], [4, 4, 4],
];

/** 像素簇：一组彩色的圆角小方块，像老游戏的像素图案。 */
export function PixelCluster({
  className = "",
  colors = DEFAULT_COLORS,
}: {
  className?: string;
  colors?: string[];
}) {
  return (
    <div aria-hidden="true" className={`grid w-fit grid-cols-5 gap-2 ${className}`}>
      {Array.from({ length: 25 }).map((_, index) => {
        const x = index % 5;
        const y = Math.floor(index / 5);
        const cell = CELLS.find(([cx, cy]) => cx === x && cy === y);
        return cell ? (
          <span
            key={index}
            className="h-5 w-5 rounded-[4px]"
            style={{ backgroundColor: colors[cell[2] % colors.length] }}
          />
        ) : (
          <span key={index} className="h-5 w-5 rounded-[4px] border border-border" />
        );
      })}
    </div>
  );
}

/** 波浪线：像手画的装饰下划线。 */
export function Squiggle({
  color = "#ff6b4a",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 12" fill="none" className={className}>
      <path
        d="M2 8 Q12 2 22 8 T42 8 T62 8 T82 8 T102 8 T118 8"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 加号：随机点缀用的小记号。 */
export function PlusMark({
  color = "#f59e0b",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className}>
      <path d="M10 3v14M3 10h14" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** 点状圆环：活泼的虚线圆。 */
export function Ring({
  color = "#7c5cff",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" className={className}>
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke={color}
        strokeWidth="7"
        strokeDasharray="1 14"
        strokeLinecap="round"
      />
    </svg>
  );
}
