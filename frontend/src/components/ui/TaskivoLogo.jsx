import logo from '../../assets/Final_Taskivo_Logo.png';

export function TaskivoLogo({ size = 40 }) {
  return (
    <img
      src={logo}
      alt="Taskivo"
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0 }}
    />
  );
}