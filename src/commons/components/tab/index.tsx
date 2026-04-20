// components/common/TabButton.tsx
import styles from './styles.module.css';

interface TabButtonProps {
  children: React.ReactNode; // 버튼 내부에 들어갈 텍스트
  variant: 'green' | 'blue' | 'orange' | 'red'; // 디자인 가이드의 4가지 색상
  onClick?: () => void; // 클릭 이벤트 핸들러
  isActive?: boolean;
}

export const TabButton = ({ children, variant, onClick, isActive }: TabButtonProps) => {
  const buttonClass = `
    ${styles.base} 
    ${styles[variant]}
    ${isActive ? styles.active : ''}  
  `;

  return (
    <button type="button" className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
};
